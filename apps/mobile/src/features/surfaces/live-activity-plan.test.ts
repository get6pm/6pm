import { describe, expect, it } from '@jest/globals';

import { moneyFormat, moneyLocale, payCycleOn, VND, type SpendRow } from '@6pm/domain';
import { t as translate } from '@6pm/i18n';
import { paletteFor } from '@6pm/theme';

import type { RunningActivity } from '../../../modules/surfaces';
import type { MoneySnapshot } from '../../data/money-store';
import { pendingPayState } from './activity-state';
import {
  isIdle,
  liveActivityPlan,
  pendingPayments,
  type ActivityPlanInput,
} from './live-activity-plan';

const today = '2026-10-09';
const stamp = '2026-10-09T05:00:00.000Z';

function spend(id: string, at: string, extra: Partial<SpendRow> = {}): SpendRow {
  return {
    id,
    day: today,
    at,
    amount: 45_000,
    categoryId: 'food',
    merchant: 'Phở Hòa',
    note: null,
    source: 'qr',
    status: 'pending',
    previousStatus: null,
    wallet: null,
    forWork: false,
    detail: null,
    foreignAmount: null,
    createdAt: stamp,
    updatedAt: stamp,
    ...extra,
  };
}

const older = spend('a', '2026-10-09T03:00:00.000Z');
const newer = spend('b', '2026-10-09T05:10:00.000Z');
const stateOf = (s: SpendRow) => `state:${s.id}:${s.amount}`;

function running(key: string, stateJson = `state:${key}:45000`, id = `act-${key}`) {
  return { id, kind: 'pendingPay', key, stateJson } satisfies RunningActivity;
}

function plan(overrides: Partial<ActivityPlanInput>) {
  return liveActivityPlan({
    running: [],
    pending: [],
    closed: false,
    foreground: true,
    enabled: true,
    held: false,
    stateOf,
    ...overrides,
  });
}

describe('liveActivityPlan', () => {
  it('starts one activity, for the newest waiting payment', () => {
    expect(plan({ pending: [older, newer] })).toEqual({
      start: { kind: 'pendingPay', key: 'b', stateJson: 'state:b:45000' },
      update: [],
      end: [],
    });
  });

  it('starts only in the foreground, with Live Activities on, after Scan has its answer', () => {
    expect(plan({ pending: [newer], foreground: false }).start).toBeNull();
    expect(plan({ pending: [newer], enabled: false }).start).toBeNull();
    expect(plan({ pending: [newer], held: true }).start).toBeNull();
  });

  it('leaves a running activity alone while its payment still waits', () => {
    expect(isIdle(plan({ pending: [newer], running: [running('b')] }))).toBe(true);
  });

  it('ends the activity once the payment is kept, skipped, deleted or cancelled', () => {
    expect(plan({ pending: [], running: [running('b')] })).toEqual({
      start: null,
      update: [],
      end: [{ id: 'act-b', finalStateJson: null }],
    });
  });

  it('ends it when the day is closed, and starts nothing', () => {
    const result = plan({ pending: [newer], running: [running('b')], closed: true });
    expect(result.end).toEqual([{ id: 'act-b', finalStateJson: null }]);
    expect(result.start).toBeNull();
  });

  it('moves to a newer waiting payment: the old one ends, the new one starts', () => {
    const result = plan({ pending: [older, newer], running: [running('a')] });
    expect(result.end).toEqual([{ id: 'act-a', finalStateJson: null }]);
    expect(result.start?.key).toBe('b');
  });

  it('ends an older activity even in the background, where nothing can start', () => {
    const result = plan({ pending: [older, newer], running: [running('a')], foreground: false });
    expect(result.end).toHaveLength(1);
    expect(result.start).toBeNull();
  });

  it('keeps only one activity per payment', () => {
    const result = plan({
      pending: [newer],
      running: [running('b', undefined, 'one'), running('b', undefined, 'two')],
    });
    expect(result.end).toEqual([{ id: 'two', finalStateJson: null }]);
    expect(result.start).toBeNull();
  });

  it('updates the activity when its words change', () => {
    const edited = { ...newer, amount: 55_000 };
    expect(plan({ pending: [edited], running: [running('b')] }).update).toEqual([
      { id: 'act-b', stateJson: 'state:b:55000' },
    ]);
  });

  it('never touches a Travel activity', () => {
    const travel: RunningActivity = { id: 't', kind: 'travel', key: 'trip', stateJson: '{}' };
    expect(isIdle(plan({ running: [travel] }))).toBe(true);
  });
});

describe('pendingPayments', () => {
  it('takes the money day’s QR payments still waiting, newest first', () => {
    const snapshot = {
      today,
      cycle: payCycleOn(today, { kind: 'lastDay' }),
      cycleSpends: [
        older,
        newer,
        spend('kept', '2026-10-09T06:00:00.000Z', { status: 'kept' }),
        spend('caught', '2026-10-09T06:00:00.000Z', { source: 'shared', status: 'caught' }),
        spend('yesterday', '2026-10-08T06:00:00.000Z', { day: '2026-10-08' }),
      ],
    } as unknown as MoneySnapshot;
    expect(pendingPayments(snapshot).map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('pendingPayState', () => {
  it('words the waiting payment and links to its details', () => {
    const state = pendingPayState(newer, {
      t: (key, ...params) => translate('en', key, ...params),
      format: moneyFormat(moneyLocale(VND, 'en')),
      palette: paletteFor({ look: 'golden', hour: 18, serious: false }),
      serious: false,
    });
    expect(state).toMatchObject({
      spendId: 'b',
      caption: 'Waiting · tap when paid',
      title: '45.000₫ to Phở Hòa',
      short: '45k',
      paid: 'Paid',
      path: '/app/spend/b',
      companion: 'think',
      amount: { prefix: '', number: '45.000', suffix: '₫' },
      detail: 'to Phở Hòa',
      bankCaption: 'Waiting · tap when paid',
      since: '2026-10-09T05:10:00.000Z',
    });
    const serious = pendingPayState(newer, {
      t: (key, ...params) => translate('vi', key, ...params),
      format: moneyFormat(moneyLocale(VND, 'vi')),
      palette: paletteFor({ look: 'golden', hour: 18, serious: true }),
      serious: true,
    });
    expect(serious.companion).toBeNull();
    expect(serious.title).toBe('45.000₫ cho Phở Hòa');
  });

  it('names the bank the payment went to, when the scan chose one', () => {
    const state = pendingPayState(
      { ...newer, wallet: 'MB Bank' },
      {
        t: (key, ...params) => translate('en', key, ...params),
        format: moneyFormat(moneyLocale(VND, 'en')),
        palette: paletteFor({ look: 'golden', hour: 18, serious: false }),
        serious: false,
      },
    );
    expect(state.detail).toBe('to Phở Hòa · opened MB Bank');
    expect(state.bankCaption).toBe('Waiting · MB Bank');
  });

  it('writes a large waiting payment the short way of the app’s language', () => {
    const big = { ...newer, amount: 1_250_000 };
    const palette = paletteFor({ look: 'golden', hour: 18, serious: false });
    const inEnglish = pendingPayState(big, {
      t: (key, ...params) => translate('en', key, ...params),
      format: moneyFormat(moneyLocale(VND, 'en')),
      palette,
      serious: false,
    });
    const inVietnamese = pendingPayState(big, {
      t: (key, ...params) => translate('vi', key, ...params),
      format: moneyFormat(moneyLocale(VND, 'vi')),
      palette,
      serious: false,
    });
    expect(inEnglish.short).toBe('1.3M');
    expect(inVietnamese.short).toBe('1,3tr');
  });
});
