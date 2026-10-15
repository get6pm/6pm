import { describe, expect, it } from 'vitest';

import { day, spend } from '../insights/insight-fixture';
import type { AskContext } from './ask-engine';
import { answerQuery } from './answer-query';
import { matchCategory, type AskLedger } from './ask-ledger';

const ctx: AskContext = {
  today: '2026-10-09',
  day: day({ spent: 104_000, safe: 247_000, free: 7_969_000, tomorrow: 362_000 }),
  daysLeft: 22,
  payday: '2026-10-31',
  futureYou: 2_000_000,
  share: 1,
  pots: [],
};

const categories = [
  { id: 'food', name: 'Ăn uống' },
  { id: 'drinks', name: 'Cà phê' },
  { id: 'transport', name: 'Đi lại' },
];

const ledger: AskLedger = {
  cycleStart: '2026-09-30',
  previousCycleStart: '2026-08-31',
  since: '2026-08-31',
  categories,
  notDaily: new Set(['home']),
  closed: [],
  bills: [
    { id: 'net', name: 'Internet', amount: 250_000, dueDay: 15, paid: false },
    { id: 'phone', name: 'Phone', amount: 100_000, dueDay: 3, paid: false },
    { id: 'gym', name: 'Gym', amount: 500_000, dueDay: 20, paid: true },
  ],
  pots: [],
  spends: [
    spend('2026-09-03', 'Highlands', 59_000, 'drinks'),
    spend('2026-10-05', 'Highlands', 59_000, 'drinks'),
    spend('2026-10-07', 'Highlands Coffee', 65_000, 'drinks'),
    spend('2026-10-07', 'Grab', 80_000, 'transport'),
    spend('2026-10-08', 'Circle K', 45_000, 'food'),
    spend('2026-10-09', 'Phở Hòa', 45_000, 'food', 'caught'),
    spend('2026-10-09', 'Not me', 900_000, 'food', 'skipped'),
    spend('2026-10-09', 'Rent', 3_500_000, 'home'),
  ],
};

describe('matchCategory', () => {
  it('matches without accents or case, and one name holding the other', () => {
    expect(matchCategory('ca phe', categories)?.id).toBe('drinks');
    expect(matchCategory('Cà phê sữa', categories)?.id).toBe('drinks');
    expect(matchCategory('shopping', categories)).toBeNull();
  });
});

describe('answerQuery', () => {
  it('totals a category over a span, skipped spends left out', () => {
    const answer = answerQuery(
      { kind: 'spend', range: { preset: 'thisWeek' }, category: 'cà phê' },
      ctx,
      ledger,
    );
    expect(answer).toMatchObject({
      kind: 'spent',
      spent: { total: 124_000, count: 2, range: { from: '2026-10-05', to: '2026-10-09' } },
      categoryId: 'drinks',
      places: [],
      partial: false,
    });
  });

  it('totals a place by any part of its name, and lists where money went when unfiltered', () => {
    const place = answerQuery(
      { kind: 'spend', range: { preset: 'thisWeek' }, merchant: 'highlands' },
      ctx,
      ledger,
    );
    expect(place).toMatchObject({ spent: { total: 124_000, count: 2 } });
    const all = answerQuery({ kind: 'spend', range: { preset: 'today' } }, ctx, ledger);
    expect(all).toMatchObject({
      spent: { total: 3_545_000 },
      places: [{ merchant: 'Rent' }, { merchant: 'Phở Hòa' }],
    });
  });

  it('says when a named category is not one of the user’s', () => {
    expect(
      answerQuery({ kind: 'spend', range: { preset: 'today' }, category: 'Pets' }, ctx, ledger),
    ).toEqual({ kind: 'noSuchCategory', name: 'Pets' });
  });

  it('breaks a span down by category, most first', () => {
    const answer = answerQuery({ kind: 'breakdown', range: { preset: 'thisWeek' } }, ctx, ledger);
    expect(answer).toMatchObject({
      kind: 'breakdown',
      categories: [
        { categoryId: 'home', amount: 3_500_000 },
        { categoryId: 'drinks', amount: 124_000 },
        { categoryId: 'food', amount: 90_000 },
        { categoryId: 'transport', amount: 80_000 },
      ],
    });
  });

  it('compares a category with the same days of the cycle before', () => {
    const answer = answerQuery(
      { kind: 'compare', range: { preset: 'thisCycle' }, category: 'Cà phê' },
      ctx,
      ledger,
    );
    expect(answer).toMatchObject({
      kind: 'compared',
      now: { total: 124_000 },
      before: { total: 59_000, range: { from: '2026-08-31', to: '2026-09-09' } },
      compare: 'muchMore',
    });
  });

  it('lists the newest spends first, and says how many more there are', () => {
    const answer = answerQuery(
      { kind: 'list', range: { preset: 'thisWeek' }, minAmount: 50_000 },
      ctx,
      ledger,
    );
    expect(answer).toMatchObject({
      kind: 'listed',
      spends: [
        { merchant: 'Rent', day: '2026-10-09' },
        { merchant: 'Grab' },
        { merchant: 'Highlands Coffee' },
        { merchant: 'Highlands' },
      ],
      more: 0,
      total: 3_704_000,
    });
  });

  it('flags a span that reaches before the records the phone keeps', () => {
    const answer = answerQuery({ kind: 'spend', range: { preset: 'last30Days' } }, ctx, {
      ...ledger,
      since: '2026-09-30',
    });
    expect(answer).toMatchObject({ partial: true });
  });

  it('lists unpaid bills due by payday, soonest first', () => {
    expect(answerQuery({ kind: 'bills' }, ctx, ledger)).toEqual({
      kind: 'bills',
      due: [{ id: 'net', name: 'Internet', amount: 250_000, on: '2026-10-15' }],
      total: 250_000,
      paid: 1,
    });
  });

  it('answers "how am I doing" with up to three facts, one of each kind', () => {
    const answer = answerQuery({ kind: 'howAmIDoing' }, ctx, ledger);
    expect(answer.kind).toBe('howAmIDoing');
    if (answer.kind !== 'howAmIDoing') return;
    expect(answer.facts.length).toBeLessThanOrEqual(3);
    expect(new Set(answer.facts.map((f) => f.kind)).size).toBe(answer.facts.length);
  });

  it('keeps the original answers, and asks for help without records', () => {
    expect(answerQuery({ kind: 'today' }, ctx, null)).toEqual({
      kind: 'today',
      safe: 247_000,
      tomorrow: 362_000,
    });
    expect(answerQuery({ kind: 'breakdown', range: { preset: 'today' } }, ctx, null)).toEqual({
      kind: 'help',
    });
    expect(answerQuery({ kind: 'chat' }, ctx, null)).toEqual({ kind: 'chat' });
  });
});
