import { describe, expect, it } from 'vitest';

import { askQuerySchema, rangeBefore, resolveRange, type RangeFrame } from './ask-query';

// Friday 9 October 2026, cycle from 30 Sep, the one before from 31 Aug.
const frame: RangeFrame = {
  today: '2026-10-09',
  cycleStart: '2026-09-30',
  previousCycleStart: '2026-08-31',
};

describe('resolveRange', () => {
  it.each([
    ['today', '2026-10-09', '2026-10-09'],
    ['yesterday', '2026-10-08', '2026-10-08'],
    ['thisWeek', '2026-10-05', '2026-10-09'],
    ['lastWeek', '2026-09-28', '2026-10-04'],
    ['thisCycle', '2026-09-30', '2026-10-09'],
    ['lastCycle', '2026-08-31', '2026-09-29'],
    ['thisMonth', '2026-10-01', '2026-10-09'],
    ['lastMonth', '2026-09-01', '2026-09-30'],
    ['last7Days', '2026-10-03', '2026-10-09'],
    ['last30Days', '2026-09-10', '2026-10-09'],
  ] as const)('%s runs %s → %s', (preset, from, to) => {
    expect(resolveRange({ preset }, frame)).toEqual({ from, to, preset });
  });

  it('turns a backwards custom span round and stops it at today', () => {
    expect(resolveRange({ from: '2026-10-20', to: '2026-10-01' }, frame)).toEqual({
      from: '2026-10-01',
      to: '2026-10-09',
      preset: null,
    });
    expect(resolveRange({ from: '2026-11-01', to: '2026-11-05' }, frame)).toBeNull();
  });

  it('has no last cycle before the first one', () => {
    expect(
      resolveRange({ preset: 'lastCycle' }, { ...frame, previousCycleStart: null }),
    ).toBeNull();
  });
});

describe('rangeBefore', () => {
  const before = (preset: Parameters<typeof resolveRange>[0]) => {
    const range = resolveRange(preset, frame);
    return range === null ? null : rangeBefore(range, frame);
  };

  it('compares like with like: the same days of the week, cycle or month before', () => {
    expect(before({ preset: 'thisWeek' })).toEqual({
      from: '2026-09-28',
      to: '2026-10-02',
      preset: 'lastWeek',
    });
    expect(before({ preset: 'thisCycle' })).toEqual({
      from: '2026-08-31',
      to: '2026-09-09',
      preset: 'lastCycle',
    });
    expect(before({ preset: 'thisMonth' })).toEqual({
      from: '2026-09-01',
      to: '2026-09-09',
      preset: 'lastMonth',
    });
  });

  it('clamps the month before to its length', () => {
    const range = { from: '2026-03-01', to: '2026-03-31', preset: 'thisMonth' } as const;
    expect(rangeBefore(range, { ...frame, today: '2026-03-31' })?.to).toBe('2026-02-28');
  });

  it('otherwise takes the same number of days just before', () => {
    expect(before({ preset: 'last7Days' })).toEqual({
      from: '2026-09-26',
      to: '2026-10-02',
      preset: null,
    });
  });
});

describe('askQuerySchema', () => {
  it('still reads every original intent', () => {
    expect(askQuerySchema.parse({ kind: 'afford', amount: 2_000_000 })).toEqual({
      kind: 'afford',
      amount: 2_000_000,
    });
  });

  it('rejects a malformed range and a name too long to be one', () => {
    expect(
      askQuerySchema.safeParse({ kind: 'spend', range: { from: '9/10', to: '2026-10-09' } })
        .success,
    ).toBe(false);
    expect(
      askQuerySchema.safeParse({
        kind: 'spend',
        range: { preset: 'today' },
        merchant: 'x'.repeat(61),
      }).success,
    ).toBe(false);
  });
});
