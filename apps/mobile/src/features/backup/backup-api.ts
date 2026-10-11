import {
  BACKUP_TOKEN_HEADER,
  deleteBackupResponseSchema,
  getBackupResponseSchema,
  putBackupResponseSchema,
  wireErrorSchema,
  type BackupEnvelope,
  type GetBackupResponse,
  type PutBackupResponse,
} from '@6pm/domain';

import { BackupError } from './backup-error';

/** The server's side of backup, at the network boundary. Every call names the backup by token. */
export interface BackupApi {
  /** When the backup was kept and how big it is, or `null` when there is none. */
  meta(token: string): Promise<PutBackupResponse | null>;
  /** The sealed backup, or `null` when there is none. */
  get(token: string): Promise<GetBackupResponse | null>;
  put(token: string, envelope: BackupEnvelope): Promise<PutBackupResponse>;
  /** Answers the same when there was nothing to delete. */
  remove(token: string): Promise<void>;
}

export interface BackupApiOptions {
  /** `https://<host>/api`, from the app config. */
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  /** A backup is megabytes, so it gets longer than an ordinary request. */
  readonly timeoutMs?: number;
}

export const BACKUP_TIMEOUT_MS = 45_000;
const PATH = '/v1/backup';

/**
 * Talks to `/v1/backup`. The token goes in a header and nowhere else; only a path and a status
 * are ever put in an error, never a body, which is ciphertext, or the token.
 */
export function createBackupApi(options: BackupApiOptions): BackupApi {
  const timeoutMs = options.timeoutMs ?? BACKUP_TIMEOUT_MS;

  async function send(
    method: 'GET' | 'PUT' | 'DELETE',
    path: string,
    token: string,
    body?: unknown,
  ): Promise<{ status: number; json: unknown }> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
      const response = await options.fetch(`${options.baseUrl}${path}`, {
        method,
        headers: {
          [BACKUP_TOKEN_HEADER]: token,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: abort.signal,
      });
      const json: unknown = await response.json().catch(() => null);
      return { status: response.status, json };
    } catch {
      throw new BackupError('network', `${method} ${path} did not get an answer`);
    } finally {
      clearTimeout(timer);
    }
  }

  function failure(method: string, path: string, answer: { status: number; json: unknown }) {
    const error = wireErrorSchema.safeParse(answer.json);
    if (
      answer.status === 400 &&
      error.success &&
      error.data.error.detail?.['reason'] === 'too_large'
    ) {
      return new BackupError('too_large');
    }
    return new BackupError('network', `${method} ${path} answered ${answer.status}`);
  }

  function parse<T>(
    schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
    answer: { json: unknown },
    what: string,
  ): T {
    const checked = schema.safeParse(answer.json);
    if (!checked.success) throw new BackupError('network', `${what} answered something unexpected`);
    return checked.data;
  }

  return {
    meta: async (token) => {
      const answer = await send('GET', `${PATH}/meta`, token);
      if (answer.status === 404) return null;
      if (answer.status !== 200) throw failure('GET', `${PATH}/meta`, answer);
      return parse(putBackupResponseSchema, answer, `GET ${PATH}/meta`);
    },
    get: async (token) => {
      const answer = await send('GET', PATH, token);
      if (answer.status === 404) return null;
      if (answer.status !== 200) throw failure('GET', PATH, answer);
      return parse(getBackupResponseSchema, answer, `GET ${PATH}`);
    },
    put: async (token, envelope) => {
      const answer = await send('PUT', PATH, token, envelope);
      if (answer.status !== 200) throw failure('PUT', PATH, answer);
      return parse(putBackupResponseSchema, answer, `PUT ${PATH}`);
    },
    remove: async (token) => {
      const answer = await send('DELETE', PATH, token);
      if (answer.status !== 200) throw failure('DELETE', PATH, answer);
      parse(deleteBackupResponseSchema, answer, `DELETE ${PATH}`);
    },
  };
}
