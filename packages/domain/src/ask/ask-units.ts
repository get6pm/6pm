import { z } from 'zod';

import { toMajor, toMinor, type Currency } from '../money/currency';
import { askQueryOptions, askQuerySchema, askReadOutputSchema, type AskQuery } from './ask-query';

/**
 * A model reads amounts as people say them: in major units of the home currency ("3.50" dollars).
 * The phone counts in whole minor units (cents). Đồng has no smaller unit, so a đồng reading is
 * already the phone's and is checked as it is.
 */

/** What the model gives back, in major units: decimals allowed. */
const majorReadOutputSchema = z.object({
  query: z.discriminatedUnion('kind', askQueryOptions(z.number().positive())),
});

/**
 * The shape a model answers in for the home currency: whole đồng as before, or major units with
 * decimals, which `queryInMinor` turns into the phone's.
 */
export function askModelOutputSchema(currency: Currency): z.ZodType<{ readonly query: unknown }> {
  return currency.code === 'VND' ? askReadOutputSchema : majorReadOutputSchema;
}

function scaled(
  query: Record<string, unknown>,
  by: (n: number) => number,
): Record<string, unknown> {
  const out = { ...query };
  for (const key of ['amount', 'minAmount'] as const) {
    const value = out[key];
    if (typeof value === 'number') out[key] = by(value);
  }
  return out;
}

/**
 * A model's query in the phone's minor units, checked like any other; null when it is not one
 * (an amount that rounds to nothing).
 */
export function queryInMinor(query: unknown, currency: Currency): AskQuery | null {
  if (typeof query !== 'object' || query === null) return null;
  const minor = scaled(query as Record<string, unknown>, (n) => toMinor(n, currency));
  const parsed = askQuerySchema.safeParse(minor);
  return parsed.success ? parsed.data : null;
}

/** A query as a model reads amounts: in major units of the home currency. */
export function queryInMajor(query: AskQuery, currency: Currency): Record<string, unknown> {
  if (currency.code === 'VND') return query;
  return scaled(query, (n) => toMajor(n, currency));
}
