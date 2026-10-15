import { describe, expect, it } from '@jest/globals';

import type { SpendRow } from '@6pm/domain';

import { dayNaming, inboxSections } from './inbox-sections';

const at = '2026-10-15T03:00:00.000Z';
const spend = (id: string, day: string, partial: Partial<SpendRow> = {}): SpendRow => ({
  id,
  day,
  at: `${day}T05:00:00.000Z`,
  amount: 30_000,
  categoryId: 'food',
  merchant: id,
  note: null,
  source: 'shared',
  status: 'caught',
  previousStatus: null,
  wallet: null,
  forWork: false,
  detail: null,
  foreignAmount: null,
  createdAt: at,
  updatedAt: at,
  ...partial,
});

// Thursday 15 October 2026; the week began on Monday the 12th.
const today = '2026-10-15';

describe('inboxSections', () => {
  it('puts what needs a look first, then today, then earlier days newest first', () => {
    const sections = inboxSections(
      [
        spend('sep', '2026-09-02'),
        spend('unread', '2026-09-30', { amount: 0 }),
        spend('wed', '2026-10-14'),
        spend('now', today),
      ],
      today,
      new Set(['2026-10-14']),
    );
    expect(sections.map((s) => [s.key, s.spends.map((x) => x.id)])).toEqual([
      ['look', ['unread']],
      ['today', ['now']],
      ['2026-10-14', ['wed']],
      ['2026-09-02', ['sep']],
    ]);
    expect(sections[2]).toMatchObject({ kind: 'earlier', closed: true });
    expect(sections[3]).toMatchObject({ kind: 'earlier', closed: false });
  });

  it('leaves out sections with nothing in them', () => {
    expect(inboxSections([spend('now', today)], today, new Set()).map((s) => s.kind)).toEqual([
      'today',
    ]);
    expect(inboxSections([], today, new Set())).toEqual([]);
  });

  it('asks for a look at a foreign spend with no rate', () => {
    const unpriced = spend('bali', today, {
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0 },
    });
    expect(inboxSections([unpriced], today, new Set()).map((s) => s.kind)).toEqual(['look']);
  });
});

describe('dayNaming', () => {
  it('names days of this week by weekday and older ones by date', () => {
    expect(dayNaming('2026-10-12', today)).toBe('weekday');
    expect(dayNaming('2026-10-11', today)).toBe('date');
    expect(dayNaming('2026-09-30', today)).toBe('date');
  });
});
