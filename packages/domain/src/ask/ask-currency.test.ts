import { describe, expect, it } from 'vitest';

import { biggestSpendFacts, categoryPaceFacts } from '../insights/pattern-facts';
import { day, input, spend } from '../insights/insight-fixture';
import { currencyOf, VND } from '../money/currency';
import { askRequestSchema } from './ask-query';
import { askModelOutputSchema, queryInMajor, queryInMinor } from './ask-units';
import { queryOfFlat } from './flat-query';
import { readQuery } from './read-query';
import {
  askCurrencyOf,
  readQuestionPrompt,
  readQuestionSystem,
  readQuestionSystemFor,
} from './read-prompt';

const USD = currencyOf('USD');
const JPY = currencyOf('JPY');

describe('reading questions in the home currency', () => {
  it('keeps the đồng rules word for word', () => {
    expect(readQuestionSystemFor(VND)).toBe(readQuestionSystem);
    expect(readQuestionSystemFor()).toBe(readQuestionSystem);
    expect(readQuestionSystem).toContain('amount in whole đồng');
  });

  it('names the home currency and its own examples, and never đồng', () => {
    const system = readQuestionSystemFor(USD);
    expect(system).toContain('amount in USD');
    expect(system).toContain('Can I afford $80 on Saturday?');
    expect(system).toContain('20 if none is said');
    expect(system).toContain('"12.50" and "12,50" are both 12.5');
    expect(system).toContain('not USD: use unknown');
    expect(system).not.toMatch(/đồng|1tr5|×1\.000\b/);
    expect(readQuestionSystemFor(JPY)).toContain('as a whole number of JPY');
  });

  it('carries the currency on the request, đồng when absent', () => {
    expect(askCurrencyOf(askRequestSchema.parse({ question: 'hi' }))).toBe(VND);
    expect(askCurrencyOf(askRequestSchema.parse({ question: 'hi', currency: 'USD' }))).toBe(USD);
    expect(askRequestSchema.safeParse({ question: 'hi', currency: 'usd' }).success).toBe(false);
  });

  it('shows the model the previous query in major units', () => {
    const previous = { kind: 'goal' as const, what: 'a car', amount: 1_500_000 };
    expect(queryInMajor(previous, USD)).toEqual({ ...previous, amount: 15_000 });
    expect(queryInMajor(previous, VND)).toBe(previous);
    const prompt = readQuestionPrompt({ question: 'and then?', currency: 'USD', previous });
    expect(prompt).toContain('"amount":15000');
  });

  it('turns a model reading into minor units, and refuses one that rounds to nothing', () => {
    expect(queryInMinor({ kind: 'afford', amount: 3.5 }, USD)).toEqual({
      kind: 'afford',
      amount: 350,
    });
    expect(
      queryInMinor({ kind: 'list', range: { preset: 'thisWeek' }, minAmount: 20 }, USD),
    ).toEqual({ kind: 'list', range: { preset: 'thisWeek' }, minAmount: 2000 });
    expect(queryInMinor({ kind: 'afford', amount: 0.001 }, USD)).toBeNull();
    expect(queryInMinor({ kind: 'afford', amount: 2_000_000 }, VND)).toEqual({
      kind: 'afford',
      amount: 2_000_000,
    });
  });

  it('lets a model answer with decimals only outside đồng', () => {
    const reading = { query: { kind: 'afford', amount: 3.5 } };
    expect(askModelOutputSchema(USD).safeParse(reading).success).toBe(true);
    expect(askModelOutputSchema(VND).safeParse(reading).success).toBe(false);
  });

  it('reads amounts with the rules in the home currency', () => {
    expect(readQuery('Can I afford $12.50?', {}, null, USD)).toEqual({
      kind: 'afford',
      amount: 1250,
    });
    expect(readQuery('what if I saved more', {}, null, USD)).toEqual({
      kind: 'saveMore',
      amount: 2000,
    });
    expect(readQuery('spends over $20 this week', {}, null, USD)).toMatchObject({
      kind: 'list',
      minAmount: 2000,
    });
    expect(readQuery('Can I afford 35?')).toEqual({ kind: 'afford', amount: 35_000 });
  });

  it('reads the phone model’s flat query in the home currency', () => {
    const flat = {
      kind: 'saveMore',
      range: 'none',
      against: 'none',
      category: '',
      merchant: '',
      pot: '',
      amount: 0,
    };
    expect(queryOfFlat(flat)).toEqual({ kind: 'saveMore', amount: 500_000 });
    expect(queryOfFlat(flat, USD)).toEqual({ kind: 'saveMore', amount: 2000 });
    expect(queryOfFlat({ ...flat, kind: 'afford', amount: 4.25 }, USD)).toEqual({
      kind: 'afford',
      amount: 425,
    });
  });
});

describe('what is worth a word, in the home currency', () => {
  it('scales the big-spend floor to the currency', () => {
    // $10 is over the $6 floor (the design's 150k) and twice a $4 line.
    const facts = biggestSpendFacts(
      input({
        currency: USD,
        day: day({ line: 400 }),
        spends: [spend('2026-10-06', 'Target', 1000, 'shopping')],
      }),
    );
    expect(facts).toHaveLength(1);
    expect(biggestSpendFacts(input({ day: day({ line: 400 }), spends: [] }))).toEqual([]);
  });

  it('scales the pace minimum to the currency', () => {
    const spends = [
      spend('2026-09-02', 'Blue Bottle', 500, 'drinks'),
      spend('2026-10-03', 'Blue Bottle', 1500, 'drinks'),
    ];
    // $5 and $15 are both over the $4 minimum (the design's 100k); in đồng they are nothing.
    expect(categoryPaceFacts(input({ spends, currency: USD }))).toHaveLength(1);
    expect(categoryPaceFacts(input({ spends }))).toEqual([]);
  });
});
