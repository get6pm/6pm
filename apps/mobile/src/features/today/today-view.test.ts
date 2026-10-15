import { describe, expect, it } from '@jest/globals';

import {
  currencyOf,
  formatVnd,
  moneyFormat,
  moneyLocale,
  payCycleOn,
  type ClosedDayRow,
  type SpendRow,
} from '@6pm/domain';

import type { MoneySnapshot } from '../../data/money-store';
import { openMemoryStore } from '../backup/test/memory-db';
import { toRowViews, todayView, type Labels } from './today-view';

const labels: Labels = {
  source: (s) => s,
  tag: () => null,
  time: (iso) => iso.slice(11, 16),
  money: { full: formatVnd },
};
const at = '2026-10-11T03:00:00.000Z';

const spend = (id: string, day: string, status: SpendRow['status']): SpendRow => ({
  id,
  day,
  at: `${day}T05:00:00.000Z`,
  amount: 30_000,
  categoryId: 'food',
  merchant: id,
  note: null,
  source: 'qr',
  status,
  previousStatus: null,
  wallet: null,
  forWork: false,
  detail: null,
  foreignAmount: null,
  createdAt: at,
  updatedAt: at,
});

const closedRow = (day: string): ClosedDayRow => ({
  day,
  closedAt: `${day}T11:30:00.000Z`,
  late: false,
  spent: 0,
  line: 0,
  tomorrow: 0,
  note: null,
});

/** A real empty snapshot, so the test follows the snapshot's shape as it grows. */
function snapshot(partial: Partial<MoneySnapshot>): MoneySnapshot {
  return {
    ...openMemoryStore('2026-10-11').getSnapshot(),
    plan: {
      income: 17_400_000,
      payday: { kind: 'lastDay' },
      futureYou: 0,
      closeAt: '18:00',
      persona: 'cheeky',
      serious: false,
      startedOn: '2026-10-05',
    },
    ...partial,
  };
}

describe('todayView', () => {
  it('queues waiting items from earlier days with today, but lists only today', () => {
    const view = todayView(
      snapshot({
        cycleSpends: [
          spend('now', '2026-10-11', 'caught'),
          spend('yesterday', '2026-10-10', 'pending'),
          spend('kept', '2026-10-11', 'kept'),
        ],
      }),
      19,
      60_000,
      labels,
    );
    expect(view.queue.map((s) => s.id)).toEqual(['now', 'yesterday']);
    expect(view.rows.map((r) => r.id)).toEqual(['now', 'kept']);
  });

  it('marks a past unclosed day since set-up as missed, and nothing before set-up', () => {
    const view = todayView(
      snapshot({
        today: '2026-10-08',
        cycle: payCycleOn('2026-10-08', { kind: 'lastDay' }),
        closedDays: [closedRow('2026-10-06')],
      }),
      12,
      0,
      labels,
    );
    const byDay = new Map(view.week.map((w) => [w.day, w]));
    expect(byDay.get('2026-10-05')?.missed).toBe(true);
    expect(byDay.get('2026-10-06')?.closed).toBe(true);
    expect(byDay.get('2026-10-06')?.missed).toBe(false);
    expect(byDay.get('2026-10-08')?.isToday).toBe(true);
    expect(byDay.get('2026-10-08')?.missed).toBe(false);
    expect(byDay.get('2026-10-09')?.future).toBe(true);
  });

  it('keeps tonight late after midnight on the money day clock', () => {
    // 01:30 the next morning is hour 25.5 of the money day: still the 11th, still unclosed, late.
    expect(todayView(snapshot({}), 25.5, 0, labels).moment).toBe('late');
    expect(todayView(snapshot({}), 10, 0, labels).moment).toBe('before');
  });

  it('shows the stamp time and counts the days closed this month', () => {
    const view = todayView(
      snapshot({ closedDays: [closedRow('2026-10-09'), closedRow('2026-10-11')] }),
      19,
      0,
      labels,
    );
    expect(view.moment).toBe('closed');
    expect(view.closedAt).toBe('2026-10-11T11:30:00.000Z');
    expect(view.closedThisMonth).toBe(2);
  });
});

describe('toRowViews', () => {
  const foreign = {
    ...spend('Grab', '2026-10-11', 'kept'),
    amount: 2_970,
    foreignAmount: { currency: 'THB', amount: 100, rate: 0.297 },
  };

  it('writes đồng rows as they always were', () => {
    const [row] = toRowViews([spend('Phở', '2026-10-11', 'kept')], [], labels);
    expect(row?.amount).toBe('30.000₫');
  });

  it('writes a foreign spend with its home amount under it', () => {
    const usd = moneyFormat(
      moneyLocale(currencyOf('USD'), 'en', { languageTag: 'en-US', decimal: '.', group: ',' }),
    );
    const [row] = toRowViews([foreign], [], { ...labels, money: usd });
    expect(row?.amount).toBe('$29.70');
    expect(row?.foreign?.inHome).toBe('$29.70');
  });

  it('leaves the home amount out while the rate is pending', () => {
    const [row] = toRowViews(
      [{ ...foreign, amount: 0, foreignAmount: { ...foreign.foreignAmount, rate: 0 } }],
      [],
      labels,
    );
    expect(row?.foreign?.inHome).toBeNull();
  });
});
