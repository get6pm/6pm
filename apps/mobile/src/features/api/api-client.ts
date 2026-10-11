import {
  registerDeviceResponseSchema,
  wireErrorSchema,
  type ApiLanguage,
  type WireErrorCode,
} from '@6pm/domain';

import { ApiRequestError, type ApiFailure } from './api-error';
import type { DeviceTokenStore } from './device-token-store';

/** A schema as the client needs it: it checks what the server sent. */
export interface ResponseSchema<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false };
}

export interface ApiClientOptions {
  /** `https://<host>/api`, from the app config. */
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  readonly tokens: DeviceTokenStore;
  /** The interface language, sent when the device registers. */
  readonly language: () => ApiLanguage;
  /** How long a call may take when it does not say. */
  readonly timeoutMs?: number;
}

export interface ApiRequest<T> {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** `/v1/...` */
  readonly path: string;
  readonly body?: unknown;
  readonly schema: ResponseSchema<T>;
  readonly timeoutMs?: number;
}

export interface ApiClient {
  /** Calls a device route: registers this phone first when it has no token, once. */
  request<T>(request: ApiRequest<T>): Promise<T>;
}

export const DEFAULT_API_TIMEOUT_MS = 15_000;

const failureOfCode: Record<WireErrorCode, ApiFailure> = {
  bad_request: 'bad_request',
  unauthorized: 'unauthorized',
  not_found: 'bad_request',
  rate_limited: 'rate_limited',
  internal: 'unavailable',
  model_unavailable: 'unavailable',
  model_timeout: 'unavailable',
};

interface Answer {
  readonly status: number;
  readonly json: unknown;
}

/**
 * The phone's one way to the 6pm server for routes that need a device: JSON in and out, the
 * bearer token attached, every answer checked against a schema, a timeout on every call. A
 * server that no longer knows the token (401) is told about it again and the call is repeated
 * once. Failures come out as `ApiRequestError` and never hold a body or a token.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const defaultTimeout = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  let registering: Promise<string> | null = null;

  async function send(
    method: string,
    path: string,
    timeoutMs: number,
    token: string | null,
    body: unknown,
  ): Promise<Answer> {
    const abort = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, timeoutMs);
    try {
      const response = await options.fetch(`${options.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: abort.signal,
      });
      const json: unknown = await response.json().catch(() => null);
      return { status: response.status, json };
    } catch {
      throw timedOut
        ? new ApiRequestError('timeout', `${method} ${path} took longer than ${timeoutMs} ms`, true)
        : new ApiRequestError('network', `${method} ${path} did not get an answer`, true);
    } finally {
      clearTimeout(timer);
    }
  }

  function failureOf(method: string, path: string, answer: Answer): ApiRequestError {
    const wire = wireErrorSchema.safeParse(answer.json);
    const where = `${method} ${path} answered ${answer.status}`;
    if (wire.success) {
      const { code, retryable } = wire.data.error;
      return new ApiRequestError(failureOfCode[code], where, retryable);
    }
    if (answer.status === 401 || answer.status === 403) {
      return new ApiRequestError('unauthorized', where, false);
    }
    if (answer.status === 429) return new ApiRequestError('rate_limited', where, true);
    if (answer.status >= 500) return new ApiRequestError('unavailable', where, true);
    return new ApiRequestError('bad_request', where, false);
  }

  /** Registers this phone, sending the token it already holds so the server learns it again. */
  async function register(known: string | null): Promise<string> {
    const answer = await send(
      'POST',
      '/v1/devices',
      defaultTimeout,
      null,
      known === null
        ? { language: options.language() }
        : { language: options.language(), token: known },
    );
    if (answer.status !== 200) throw failureOf('POST', '/v1/devices', answer);
    const checked = registerDeviceResponseSchema.safeParse(answer.json);
    if (!checked.success) {
      throw new ApiRequestError(
        'bad_response',
        'POST /v1/devices answered something unexpected',
        false,
      );
    }
    try {
      await options.tokens.write(checked.data.token);
    } catch {
      throw new ApiRequestError('unauthorized', 'The token could not be kept on this phone', false);
    }
    return checked.data.token;
  }

  /** The token to use; concurrent callers share one registration. */
  function ensureToken(renew: boolean): Promise<string> {
    registering ??= (async () => {
      const known = await options.tokens.read().catch(() => null);
      if (known !== null && !renew) return known;
      return register(known);
    })().finally(() => {
      registering = null;
    });
    return registering;
  }

  return {
    request: async <T>(request: ApiRequest<T>): Promise<T> => {
      const method = request.method ?? 'GET';
      const timeoutMs = request.timeoutMs ?? defaultTimeout;
      const call = (token: string) => send(method, request.path, timeoutMs, token, request.body);

      let answer = await call(await ensureToken(false));
      if (answer.status === 401) answer = await call(await ensureToken(true));
      if (answer.status < 200 || answer.status >= 300) {
        throw failureOf(method, request.path, answer);
      }
      const checked = request.schema.safeParse(answer.json);
      if (!checked.success) {
        throw new ApiRequestError(
          'bad_response',
          `${method} ${request.path} answered something unexpected`,
          false,
        );
      }
      return checked.data;
    },
  };
}
