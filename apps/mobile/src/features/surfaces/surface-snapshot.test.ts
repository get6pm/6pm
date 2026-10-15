import { describe, expect, it } from '@jest/globals';

import {
  formatShort,
  moneyFormat,
  moneyLocale,
  payCycleOn,
  VND,
  surfaceContextSchema,
  surfaceSnapshotSchema,
  type CategoryRow,
  type SpendRow,
} from '@6pm/domain';
import { t as translate, type Language } from '@6pm/i18n';
import { paletteFor } from '@6pm/theme';

import { dayOf, type MoneySnapshot } from '../../data/money-store';
import { DEFAULT_PLAN } from '../../data/plan-settings';
import type { I18n } from '../../i18n/i18n';
import { contextStrings, hostOf, surfaceContext } from './surface-context';
import { widgetLook, widgetTokens } from './surface-palette';
import {
  glyphOf,
  moneyDayStart,
  nextMoneyDay,
  snapshotKey,
  surfaceSnapshot,
} from './surface-snapshot';

const stamp = '2026-10-09T05:00:00.000Z';
const food: CategoryRow = {
  id: 'food',
  name: 'Food',
  icon: 'restaurant',
  hue: 45,
  countsDaily: true,
  sort: 0,
  archivedAt: null,
};

let n = 0;
function spend(day: string, amount: number, extra: Partial<SpendRow> = {}): SpendRow {
  n += 1;
  return {
    id: `s${n}`,
    day,
    at: `${day}T0${n % 10}:00:00.000Z`,
    amount,
    categoryId: 'food',
    merchant: `Shop ${n}`,
    note: null,
    source: 'manual',
    status: 'kept',
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

function money(today: string, cycleSpends: SpendRow[], serious = false): MoneySnapshot {
  return {
    today,
    plan: { ...DEFAULT_PLAN, income: 12_000_000, futureYou: 1_000_000, serious },
    cycle: payCycleOn(today, { kind: 'lastDay' }),
    categories: [food],
    cycleSpends,
    waitingBefore: [],
    bills: [],
    pots: [],
    potSaved: {},
    topUpsThisCycle: 0,
    setAsideThisCycle: {},
    closedDays: [],
  };
}

const words =
  (language: Language): I18n['t'] =>
  (key, ...params) =>
    translate(language, key, ...params);
const en = words('en');
const vi = words('vi');

const golden = widgetLook({ max: false, look: 'paper', serious: false });
const writtenAt = new Date('2026-10-09T11:07:00.000Z');

function snapshotOf(m: MoneySnapshot, language: Language = 'en') {
  const t = language === 'vi' ? vi : en;
  const format = moneyFormat(moneyLocale(VND, language));
  return surfaceSnapshot({ money: m, look: golden, maxLook: null, t, format, writtenAt });
}

describe('surfaceSnapshot', () => {
  const today = '2026-10-09';
  const spends = [
    spend(today, 25_000, { merchant: 'Bánh mì Cô Ba' }),
    spend(today, 45_000, { merchant: 'Phở Hòa', source: 'qr', status: 'pending' }),
    spend(today, 45_000, { merchant: 'Trà sữa' }),
    spend(today, 30_000),
    spend(today, 20_000, { status: 'skipped' }),
    spend(today, 15_000),
    spend('2026-10-08', 120_000),
  ];

  it('shows the same number as Today, and tomorrow’s line from the next 04:00', () => {
    const m = money(today, spends);
    const snap = snapshotOf(m);
    const day = dayOf(m);
    expect(day).not.toBeNull();
    if (day === null) return;
    expect(surfaceSnapshotSchema.parse(snap)).toEqual(snap);
    const [now, next] = snap.entries;
    expect(now?.safeShort).toBe(formatShort(Math.max(0, day.safe), 'en'));
    expect(now?.safeText).toBe(`${formatShort(day.safe, 'en')} left`);
    expect(now?.tomorrowText).toBe(`Tomorrow ≈ ${formatShort(day.tomorrow, 'en')}`);
    expect(now?.from).toBe(new Date(2026, 9, 9, 4, 0, 0).toISOString());
    expect(next?.from).toBe(new Date(2026, 9, 10, 4, 0, 0).toISOString());
    // Nothing spent yet tomorrow: the whole line is safe.
    expect(next?.safeShort).toBe(formatShort(day.tomorrow, 'en'));
    expect(next?.list).toEqual([]);
    expect(next?.ringFraction).toBe(1);
  });

  it('fills the ring with what is left of the line, and empties it once the day is over', () => {
    const m = money(today, spends);
    const day = dayOf(m);
    if (day === null) throw new Error('no day');
    expect(snapshotOf(m).entries[0]?.ringFraction).toBeCloseTo(1 - day.spent / day.line);
    const over = money(today, [spend(today, 5_000_000)]);
    expect(snapshotOf(over).entries[0]?.safeShort).toBe('0k');
    expect(snapshotOf(over).entries[0]?.ringFraction).toBe(0);
  });

  it('lists three of today’s spends, newest first, then "+N more"; skipped ones are left out', () => {
    const entry = snapshotOf(money(today, spends)).entries[0];
    expect(entry?.list.map((r) => r.name)).toEqual(['Bánh mì Cô Ba', 'Phở Hòa', 'Trà sữa']);
    expect(entry?.list.map((r) => r.amountText)).toEqual(['25.000₫', '45.000₫', '45.000₫']);
    expect(entry?.list.map((r) => r.icon)).toEqual([
      glyphOf('bakery_dining'),
      glyphOf('ramen_dining'),
      glyphOf('emoji_food_beverage'),
    ]);
    expect(entry?.list.map((r) => r.pending)).toEqual([false, true, false]);
    expect(entry?.moreText).toBe('+2 more');
    expect(entry?.pendingText).toBe('1 pending');
  });

  it('carries the tile colours of every listed hue', () => {
    const snap = snapshotOf(money(today, spends));
    expect(snap.strings['tile.45.from']).toMatch(/^#[0-9a-f]{6}$/);
    expect(snap.strings['tile.45.glyph']).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('starts a fresh cycle when the next money day is payday', () => {
    const eve = '2026-10-30';
    const m = money(eve, [spend(eve, 400_000), spend('2026-10-20', 900_000)]);
    const next = nextMoneyDay(m);
    expect(next.today).toBe('2026-10-31');
    expect(next.cycle.start).not.toBe(m.cycle.start);
    expect(next.cycleSpends).toEqual([]);
    const fresh = dayOf(next);
    if (fresh === null) throw new Error('no day');
    expect(snapshotOf(m).entries[1]?.safeShort).toBe(formatShort(fresh.safe, 'en'));
  });

  it('writes no entries before the month is set up, and the words to ask for it', () => {
    const snap = snapshotOf({ ...money(today, []), plan: null });
    expect(snap.entries).toEqual([]);
    expect(snap.strings['setUp']).toBe('Open 6pm to set up');
  });

  it('words everything in the app’s language', () => {
    const snap = snapshotOf(money(today, spends), 'vi');
    expect(snap.entries[0]?.tomorrowText.startsWith('Ngày mai ≈ ')).toBe(true);
    expect(snap.entries[0]?.moreText).toBe('+2 khoản nữa');
    expect(snap.strings['scanQr']).toBe('Quét QR');
  });

  it('draws free widgets in Golden Hour and Max widgets in the user’s look', () => {
    const free = snapshotOf(money(today, spends));
    expect(free.maxLook).toBeNull();
    expect(free.palettes).toHaveLength(24);
    expect(free.palettes[18]?.tokens).toEqual(
      widgetTokens(paletteFor({ look: 'golden', hour: 18, serious: false })),
    );
    const paper = widgetLook({ max: true, look: 'paper', serious: false });
    const max = surfaceSnapshot({
      money: money(today, spends),
      look: paper,
      maxLook: 'paper',
      t: en,
      format: moneyFormat(moneyLocale(VND, 'en')),
      writtenAt,
    });
    expect(max.maxLook).toBe('paper');
    expect(max.palettes[18]?.tokens).toEqual(
      widgetTokens(paletteFor({ look: 'paper', hour: 18, serious: false })),
    );
    expect(max.strings['font.display']).toBe('Baloo2');
    expect(free.strings['font.display']).toBe('BricolageGrotesque');
  });

  it('uses the serious palette in serious mode', () => {
    const look = widgetLook({ max: true, look: 'neon', serious: true });
    const snap = surfaceSnapshot({
      money: money(today, spends, true),
      look,
      maxLook: 'neon',
      t: en,
      format: moneyFormat(moneyLocale(VND, 'en')),
      writtenAt,
    });
    expect(snap.serious).toBe(true);
    expect(snap.palettes[12]?.tokens).toEqual(
      widgetTokens(paletteFor({ look: 'neon', hour: 12, serious: true })),
    );
  });

  it('compares equal when only the write time differs', () => {
    const m = money(today, spends);
    const a = snapshotOf(m);
    const b = surfaceSnapshot({
      money: m,
      look: golden,
      maxLook: null,
      t: en,
      format: moneyFormat(moneyLocale(VND, 'en')),
      writtenAt: new Date(writtenAt.getTime() + 60_000),
    });
    expect(snapshotKey(a)).toBe(snapshotKey(b));
    expect(moneyDayStart('2026-10-09').getHours()).toBe(4);
  });
});

describe('surfaceContext', () => {
  it('keeps {amount} in the safe-after line for the domain to fill', () => {
    expect(contextStrings(en)).toEqual({
      today: 'Today',
      yesterday: 'Yesterday',
      safeAfter: 'Safe today is now {amount}',
    });
    expect(contextStrings(vi)['safeAfter']).toContain('{amount}');
  });

  it('reads the host from the API base', () => {
    expect(hostOf('https://6pm-dev.oddeggs.studio/api')).toBe('6pm-dev.oddeggs.studio');
    expect(hostOf(undefined)).toBeNull();
  });

  it('files with the categories, the rules and today’s number', () => {
    const m = money('2026-10-09', []);
    const rule = {
      merchantKey: 'pho hoa',
      merchant: 'Phở Hòa',
      categoryId: 'food',
      learnedTimes: 2,
      setByUser: false,
    };
    const context = surfaceContext({
      money: m,
      rules: [rule],
      language: 'en',
      host: '6pm.oddeggs.studio',
      strings: contextStrings(en),
    });
    expect(surfaceContextSchema.parse(context)).toEqual(context);
    expect(context.safeToday).toBe(dayOf(m)?.safe);
    expect(context.rules).toEqual([{ key: 'pho hoa', categoryId: 'food' }]);
  });
});
