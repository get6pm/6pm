import { z } from 'zod';

/**
 * Frankfurter's v2 HTTP client: a timeout, retries with backoff on transient failures only, and a
 * typed, non-retryable error for anything else (an unknown currency, a malformed body). v2 blends
 * many central banks, so it quotes the đồng, which the ECB set of v1 never did.
 *
 * Each `rate` is captured from the response's source text (`JSON.parse` source access), never
 * through the parser's number coercion, so a rate keeps exactly the digits Frankfurter sent.
 */

const DEFAULT_BASE_URL = 'https://api.frankfurter.dev';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_RETRIES = 2;
const BASE_BACKOFF_MS = 100;

export class FrankfurterError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(message: string, options: { status?: number; retryable: boolean; cause?: unknown }) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'FrankfurterError';
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

const rateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  base: z.string().regex(/^[A-Z]{3}$/),
  quote: z.string().regex(/^[A-Z]{3}$/),
  rate: z.string().regex(/^\d+(?:\.\d+)?$/),
});
const ratesSchema = z.array(rateSchema);

export type FrankfurterRate = z.infer<typeof rateSchema>;

export interface FetchRatesInput {
  readonly base: string;
  readonly quotes: readonly string[];
}

export interface FrankfurterClientOptions {
  readonly baseUrl?: string;
  /** Clamped to 1 ms – 120 s. Default 10 s. */
  readonly timeoutMs?: number;
  readonly retries?: number;
  /** The network boundary, replaced in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** "6.9e-05" → "0.000069": a number's source text as a plain decimal, digit for digit. */
export function plainDecimal(text: string): string {
  const match = /^(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(text);
  if (match === null) return text;
  const [, whole = '', fraction = '', exponentText = '0'] = match;
  const digits = whole + fraction;
  const point = whole.length + Number(exponentText);
  const padded =
    point <= 0
      ? '0.' + '0'.repeat(-point) + digits
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : digits.slice(0, point) + '.' + digits.slice(point);
  const [head = '0', tail] = padded.split('.');
  const trimmedHead = head.replace(/^0+(?=\d)/, '');
  const trimmedTail = tail?.replace(/0+$/, '');
  return trimmedTail ? `${trimmedHead}.${trimmedTail}` : trimmedHead;
}

function parseRates(text: string): readonly FrankfurterRate[] {
  let parsed: unknown;
  try {
    // The reviver's third argument holds the value's source text. TypeScript's lib does not model
    // it yet, so it is typed loosely; without it the number is written back as JS prints it.
    parsed = JSON.parse(text, (key: string, value: unknown, context?: { source?: string }) => {
      if (key !== 'rate') return value;
      if (typeof context?.source === 'string') return plainDecimal(context.source);
      return typeof value === 'number' ? plainDecimal(String(value)) : value;
    });
  } catch (cause) {
    throw new FrankfurterError('Frankfurter sent a body that is not JSON', {
      retryable: false,
      cause,
    });
  }
  const result = ratesSchema.safeParse(parsed);
  if (!result.success) {
    throw new FrankfurterError('Frankfurter sent an unexpected shape', {
      retryable: false,
      cause: result.error,
    });
  }
  return result.data;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchOnce(
  url: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<readonly FrankfurterRate[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } catch (cause) {
    throw new FrankfurterError('Frankfurter could not be reached', { retryable: true, cause });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new FrankfurterError(`Frankfurter answered ${response.status}`, {
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
    });
  }
  return parseRates(await response.text());
}

/**
 * The latest rates of `base` against each of `quotes`, retrying a timeout, a network failure, a
 * 5xx or a 429 with backoff; anything else throws at once.
 */
export async function fetchRates(
  input: FetchRatesInput,
  options: FrankfurterClientOptions = {},
): Promise<readonly FrankfurterRate[]> {
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1), MAX_TIMEOUT_MS);
  const retries = options.retries ?? DEFAULT_RETRIES;
  const fetchImpl = options.fetchImpl ?? fetch;
  // An absolute path keeps only the origin of `baseUrl`, with or without a trailing "/v2".
  const url = new URL('/v2/rates', options.baseUrl ?? DEFAULT_BASE_URL);
  url.searchParams.set('base', input.base);
  url.searchParams.set('quotes', input.quotes.join(','));

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchOnce(url.toString(), timeoutMs, fetchImpl);
    } catch (error) {
      if (error instanceof FrankfurterError && !error.retryable) throw error;
      lastError = error;
      if (attempt < retries) await sleep(BASE_BACKOFF_MS * 2 ** attempt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new FrankfurterError('Frankfurter failed', { retryable: true, cause: lastError });
}
