import { describe, expect, it } from 'vitest';

import { queryOfFlat, type FlatQuery } from './flat-query';

const flat = (overrides: Partial<FlatQuery>): FlatQuery => ({
  kind: 'unknown',
  range: 'none',
  against: 'none',
  category: '',
  merchant: '',
  pot: '',
  amount: 0,
  ...overrides,
});

describe('queryOfFlat', () => {
  it('turns a flat reading into the query it stands for', () => {
    expect(queryOfFlat(flat({ kind: 'spend', range: 'thisWeek', category: 'Cà phê ' }))).toEqual({
      kind: 'spend',
      range: { preset: 'thisWeek' },
      category: 'Cà phê',
    });
    expect(
      queryOfFlat(flat({ kind: 'compare', range: 'thisMonth', against: 'lastMonth' })),
    ).toEqual({
      kind: 'compare',
      range: { preset: 'thisMonth' },
      against: { preset: 'lastMonth' },
    });
    expect(queryOfFlat(flat({ kind: 'afford', amount: 2_000_000 }))).toEqual({
      kind: 'afford',
      amount: 2_000_000,
    });
    expect(queryOfFlat(flat({ kind: 'potFull', pot: 'Đà Lạt' }))).toEqual({
      kind: 'potFull',
      pot: 'Đà Lạt',
    });
    expect(queryOfFlat(flat({ kind: 'bills' }))).toEqual({ kind: 'bills' });
  });

  it('takes the rules’ defaults for spans not said', () => {
    expect(queryOfFlat(flat({ kind: 'list', merchant: 'Circle K' }))).toEqual({
      kind: 'list',
      range: { preset: 'thisWeek' },
      merchant: 'Circle K',
    });
    expect(queryOfFlat(flat({ kind: 'saveMore' }))).toEqual({ kind: 'saveMore', amount: 500_000 });
  });

  it('rejects what is not a query', () => {
    expect(queryOfFlat(flat({ kind: 'afford', amount: 0 }))).toBeNull();
    expect(queryOfFlat(flat({ kind: 'launchRocket' }))).toBeNull();
  });
});
