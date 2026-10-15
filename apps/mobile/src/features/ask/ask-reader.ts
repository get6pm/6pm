import {
  askRequestSchema,
  askResponseSchema,
  readQuery,
  type AskQuery,
  type LocalDate,
} from '@6pm/domain';

import type { ApiClient } from '../api/api-client';

/** How long the server gets to read a question before the phone reads it with rules. */
export const ASK_SERVER_TIMEOUT_MS = 4_000;

export interface QueryReading {
  readonly query: AskQuery;
  /** The server did not read it (offline, too slow, refused): the phone's rules did. */
  readonly offline: boolean;
}

/** What helps read a question: the money day and the user's own names, never an amount. */
export interface ReadingHelp {
  readonly today: LocalDate;
  readonly categories: readonly string[];
  readonly pots: readonly string[];
  /** The query before this one, for a follow-up ("what about last month?"). */
  readonly previous: AskQuery | null;
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
 * Reads a question into a query. The server's model goes first, for accuracy: it sees the
 * question and the user's category and pot names, nothing of their money. When it cannot answer
 * in time, or at all, the phone's own rules read the question instead, so Ask still works
 * offline. A server that only knows the original intents still answers with one.
 */
export async function readQuestion(
  api: Pick<ApiClient, 'request'>,
  question: string,
  help: ReadingHelp,
  timeoutMs: number = ASK_SERVER_TIMEOUT_MS,
): Promise<QueryReading> {
  const request = askRequestSchema.safeParse({
    question,
    today: help.today,
    categories: help.categories
      .filter((n) => n.trim() !== '')
      .slice(0, 50)
      .map((n) => n.slice(0, 40)),
    pots: help.pots
      .filter((n) => n.trim() !== '')
      .slice(0, 30)
      .map((n) => n.slice(0, 40)),
    ...(help.previous === null ? {} : { previous: help.previous }),
  });
  if (request.success) {
    try {
      const answer = await deadline(
        api.request({
          method: 'POST',
          path: '/v1/ask',
          body: request.data,
          schema: askResponseSchema,
          timeoutMs,
        }),
        timeoutMs,
      );
      if (answer.query !== undefined) return { query: answer.query, offline: false };
      // A server that only knows the original six says "unknown" to the rest; the rules may know.
      if (answer.intent.kind !== 'unknown') return { query: answer.intent, offline: false };
      const ruled = readQuery(question, { pots: help.pots, categories: help.categories });
      return { query: ruled, offline: ruled.kind === 'unknown' };
    } catch {
      // Falls through: any failure of the server means the rules read it.
    }
  }
  return {
    query: readQuery(question, { pots: help.pots, categories: help.categories }),
    offline: true,
  };
}
