import { askRequestSchema, askResponseSchema, readIntent, type AskIntent } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';

/** How long the server gets to read a question before the phone reads it with rules. */
export const ASK_SERVER_TIMEOUT_MS = 4_000;

export interface IntentReading {
  readonly intent: AskIntent;
  /** The server did not read it (offline, too slow, refused): the phone's rules did. */
  readonly offline: boolean;
}

/** Rejects after `ms`, so a slow registration or a hung connection never holds the chat. */
function deadline<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The server was too slow')), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('The server failed'));
      },
    );
  });
}

/**
 * Reads a question into an intent. The server's model goes first, for accuracy: it sees the
 * question and nothing of the user's money. When it cannot answer in time, or at all, the phone's
 * own rules read the question instead, so Ask still works offline.
 */
export async function readQuestion(
  api: Pick<ApiClient, 'request'>,
  question: string,
  potNames: readonly string[],
  timeoutMs: number = ASK_SERVER_TIMEOUT_MS,
): Promise<IntentReading> {
  const request = askRequestSchema.safeParse({ question });
  if (request.success) {
    try {
      const { intent } = await deadline(
        api.request({
          method: 'POST',
          path: '/v1/ask',
          body: request.data,
          schema: askResponseSchema,
          timeoutMs,
        }),
        timeoutMs,
      );
      return { intent, offline: false };
    } catch {
      // Falls through: any failure of the server means the rules read it.
    }
  }
  return { intent: readIntent(question, potNames), offline: true };
}
