import { z } from 'zod';

/**
 * Jev, the decision model: it answers a typed question about a piece of text with a label, a
 * probability per label and a confidence, never with prose. The address, the version and the time
 * budget are pinned here: thresholds are tuned against one version, so no setting can move them.
 *
 * Only the text under question is sent: no device, language or money context.
 */
export const jevUrl = 'https://api.typesafe.ai/v1/systemone';
export const jevModel = 'jev-1.13.0';
export const jevTimeoutMs = 800;

/** One closed question: the options by name, each with what it means. */
export type ChoiceQuestion<Option extends string = string> = {
  readonly instructions: string;
  readonly criteria: Readonly<Record<Option, string>>;
};

/** The answer to a choice question, in the same shape whichever model gave it. */
export type ChoiceAnswer<Option extends string = string> = {
  /** The most likely option. */
  readonly choice: Option;
  /** Every option's probability, 0 to 1. */
  readonly probabilities: Readonly<Record<Option, number>>;
  readonly confidence: number;
};

export type ModelAnswer<T> = {
  readonly answer: T;
  /** The model id the provider's response names. */
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
};

export type JevFailure =
  | 'missing_key'
  | 'timeout'
  | 'rate_limited'
  | 'overloaded'
  | 'provider_error'
  | 'transport_error'
  | 'invalid_response';

/** Jev did not answer. The reason is for the log line; every reason hands over to the fallback. */
export class JevUnavailable extends Error {
  readonly reason: JevFailure;

  constructor(reason: JevFailure) {
    super(`jev unavailable: ${reason}`);
    this.name = 'JevUnavailable';
    this.reason = reason;
  }
}

export type JevConfig = {
  readonly apiKey: string | undefined;
  /** The network boundary, replaced by recorded answers in tests. */
  readonly fetch?: typeof fetch;
  /** Less than the whole budget, for a second attempt inside what the first left over. */
  readonly timeoutMs?: number;
};

const probability = z.number().min(0).max(1);
const tokenCount = z.number().int().min(0).catch(0);

/** The name every request gives its single question. */
const questionKey = 'answer';

export function optionsOf<Option extends string>(
  question: ChoiceQuestion<Option>,
): [Option, ...Option[]] {
  const [first, ...rest] = Object.keys(question.criteria) as Option[];
  if (first === undefined) throw new TypeError('A choice question needs options');
  return [first, ...rest];
}

function responseSchema<Option extends string>(options: [Option, ...Option[]]) {
  return z.object({
    model: z.string().min(1).catch(jevModel),
    answers: z.object({
      [questionKey]: z.object({
        choice: z.enum(options),
        probabilities: z.object(Object.fromEntries(options.map((option) => [option, probability]))),
        confidence: probability,
      }),
    }),
    usage: z
      .object({ input_tokens: tokenCount, output_tokens: tokenCount })
      .catch({ input_tokens: 0, output_tokens: 0 }),
  });
}

function failureFor(status: number): JevFailure {
  if (status === 429) return 'rate_limited';
  if (status === 529) return 'overloaded';
  return 'provider_error';
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

/** Asks Jev one choice question about `text`. Throws `JevUnavailable` when it gives no answer. */
export async function askJev<Option extends string>(
  config: JevConfig,
  text: string,
  question: ChoiceQuestion<Option>,
): Promise<ModelAnswer<ChoiceAnswer<Option>>> {
  if (config.apiKey === undefined || config.apiKey === '') throw new JevUnavailable('missing_key');
  const options = optionsOf(question);
  const send = config.fetch ?? fetch;

  let json: unknown;
  try {
    const response = await send(jevUrl, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: jevModel,
        state: text,
        questions: { [questionKey]: { type: 'choice', ...question } },
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? jevTimeoutMs),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new JevUnavailable(failureFor(response.status));
    }
    json = await response.json();
  } catch (error) {
    if (error instanceof JevUnavailable) throw error;
    throw new JevUnavailable(isTimeout(error) ? 'timeout' : 'transport_error');
  }

  const parsed = responseSchema(options).safeParse(json);
  if (!parsed.success) throw new JevUnavailable('invalid_response');
  const { choice, probabilities, confidence } = parsed.data.answers[questionKey] as {
    choice: Option;
    probabilities: Record<Option, number>;
    confidence: number;
  };
  return {
    answer: { choice, probabilities, confidence },
    model: parsed.data.model,
    inputTokens: parsed.data.usage.input_tokens,
    outputTokens: parsed.data.usage.output_tokens,
  };
}
