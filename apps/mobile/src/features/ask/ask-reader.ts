import {
  askRequestSchema,
  askResponseSchema,
  readQuery,
  type AskQuery,
  type Currency,
  type LocalDate,
} from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { localReading } from '../local-model/local-tiers';
import { readAiMode, requireServerAi, type AiModeSettings } from '../privacy/ai-mode';

/** How long the server gets to read a question before the phone reads it with rules. */
export const ASK_SERVER_TIMEOUT_MS = 4_000;

export interface QueryReading {
  readonly query: AskQuery;
  /**
   * The server did not read it (offline, too slow, refused): the phone's rules did. Never set in
   * on-device mode, where the rules reading it is the chosen way, not a fallback.
   */
  readonly offline: boolean;
}

/** What helps read a question: the money day and the user's own names, never an amount. */
export interface ReadingHelp {
  readonly today: LocalDate;
  readonly categories: readonly string[];
  readonly pots: readonly string[];
  /** The query before this one, for a follow-up ("what about last month?"). */
  readonly previous: AskQuery | null;
  /** The home currency: its code goes to the server, so amounts are read in it. */
  readonly currency: Currency;
  /** The readings before `previous`, oldest first, for follow-ups further back. */
  readonly earlier?: readonly AskQuery[];
  /** The user's own places, for the rules alone: they never leave the phone. */
  readonly merchants?: readonly string[];
}

/** The phone's own reading, with the names it keeps and the question before. */
function readHere(question: string, help: ReadingHelp): AskQuery {
  return readQuery(
    question,
    { pots: help.pots, categories: help.categories, merchants: help.merchants ?? [] },
    help.previous,
    help.currency,
  );
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
 * Reads a question into a query. In server mode the server's model goes first, for accuracy: it
 * sees the question and the user's category and pot names, nothing of their money. When it cannot
 * answer in time, or at all, the phone's own rules read the question instead, so Ask still works
 * offline. A server that only knows the original intents still answers with one. In on-device
 * mode nothing is sent: the phone's rules read the question, and the downloaded model reads what
 * they cannot.
 */
export async function readQuestion(
  api: Pick<ApiClient, 'request'>,
  settings: AiModeSettings,
  question: string,
  help: ReadingHelp,
  timeoutMs: number = ASK_SERVER_TIMEOUT_MS,
): Promise<QueryReading> {
  if (readAiMode(settings) === 'device') {
    // The rules first; the downloaded model only for what they cannot read, and never sent.
    const ruled = readHere(question, help);
    if (ruled.kind !== 'unknown') return { query: ruled, offline: false };
    const local = await localReading(
      settings,
      {
        question,
        today: help.today,
        categories: [...help.categories],
        pots: [...help.pots],
        ...(help.previous === null ? {} : { previous: help.previous }),
      },
      help.currency,
    );
    return { query: local, offline: false };
  }
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
    // Đồng is what a server that predates the field reads anyway.
    ...(help.currency.code === 'VND' ? {} : { currency: help.currency.code }),
    ...(help.earlier === undefined || help.earlier.length === 0
      ? {}
      : { earlier: help.earlier.slice(-3) }),
  });
  if (request.success) {
    try {
      requireServerAi(settings, 'ask');
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
      const ruled = readHere(question, help);
      return { query: ruled, offline: ruled.kind === 'unknown' };
    } catch {
      // Falls through: any failure of the server means the rules read it.
    }
  }
  return { query: readHere(question, help), offline: true };
}
