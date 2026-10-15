import {
  addDays,
  lineUsed,
  payCycleOn,
  SURFACES_VERSION,
  type DailyNumber,
  type LocalDate,
  moneyFormat,
  moneyLocale,
  VND,
  type MoneyFormat,
  type SpendRow,
  type SurfaceSnapshot,
} from '@6pm/domain';

import { dayOf, waitingOf, type MoneySnapshot } from '../../data/money-store';
import type { I18n } from '../../i18n/i18n';
import { isSymbolName } from '../../ui/icons/symbol';
import { symbolCodepoints, type SymbolName } from '../../ui/icons/symbols.generated';
import { merchantIcon } from '../today/merchant-icon';
import { displayFamily, hourlyPalettes, tileColours, type WidgetLook } from './surface-palette';

type Entry = SurfaceSnapshot['entries'][number];
type Row = Entry['list'][number];

/** The large widget lists this many of today's spends, then "+N more". */
export const LIST_ROWS = 3;

/**
 * A Material Symbols glyph as the character the bundled font draws it with: the widgets set it in
 * the same font file, so Swift needs neither the icon names nor ligatures.
 */
export function glyphOf(name: SymbolName): string {
  return String.fromCodePoint(symbolCodepoints[name]);
}

/** When a money day begins on the phone's clock: 04:00 (see `moneyDayOf`). */
export function moneyDayStart(day: LocalDate): Date {
  return new Date(`${day}T04:00:00`);
}

/**
 * The money as it will stand when the next money day begins, if nothing else happens: today's
 * spends become "spent before", and a payday in between starts a fresh cycle. The domain's own
 * daily number then works out tomorrow's line from it.
 */
export function nextMoneyDay(money: MoneySnapshot): MoneySnapshot {
  const today = addDays(money.today, 1);
  const cycle = payCycleOn(today, money.plan?.payday ?? { kind: 'lastDay' });
  const sameCycle = cycle.start === money.cycle.start;
  return {
    ...money,
    today,
    cycle,
    cycleSpends: sameCycle ? money.cycleSpends : [],
    topUpsThisCycle: sameCycle ? money.topUpsThisCycle : 0,
  };
}

function rowsOf(
  money: MoneySnapshot,
  format: MoneyFormat,
): { rows: Row[]; hues: number[]; total: number } {
  const categories = new Map(money.categories.map((c) => [c.id, c]));
  const todays = money.cycleSpends.filter(
    (s) => s.day === money.today && s.status !== 'skipped' && s.status !== 'deleted',
  );
  const rows = todays.slice(0, LIST_ROWS).map((s): Row => {
    const category = categories.get(s.categoryId);
    const categoryIcon = category && isSymbolName(category.icon) ? category.icon : 'payments';
    return {
      name: s.merchant,
      amountText: format.full(s.amount),
      icon: glyphOf(merchantIcon(s.merchant, categoryIcon)),
      hue: category?.hue ?? 80,
      pending: s.status === 'pending',
    };
  });
  return { rows, hues: rows.map((r) => r.hue), total: todays.length };
}

/** QR payments handed to a bank and not yet confirmed: the "2 pending" on the widgets. */
export function pendingCount(money: MoneySnapshot): number {
  return waitingOf(money).filter((s: SpendRow) => s.status === 'pending').length;
}

function entryOf(
  day: DailyNumber,
  from: Date,
  list: { rows: Row[]; total: number },
  pending: number,
  t: I18n['t'],
  format: MoneyFormat,
): Entry {
  const safeShort = format.short(Math.max(0, day.safe));
  const more = list.total - list.rows.length;
  return {
    from: from.toISOString(),
    safeText: t('surfaces.amountLeft', { amount: safeShort }),
    safeShort,
    tomorrowText: t('today.tomorrowAbout', { amount: format.short(day.tomorrow) }),
    pendingText: pending > 0 ? t('surfaces.pending', { count: pending }) : '',
    ringFraction: day.safe < 0 ? 0 : 1 - lineUsed(day),
    list: list.rows,
    moreText: more > 0 ? t('surfaces.more', { count: more }) : '',
  };
}

export interface SnapshotInput {
  readonly money: MoneySnapshot;
  readonly look: WidgetLook;
  /** The look id when the user has Max (widgets in their look), else null. */
  readonly maxLook: string | null;
  readonly t: I18n['t'];
  /** Money in the home currency, the app's language and the phone's number style. */
  readonly format?: MoneyFormat;
  /** Without a `format`, đồng in this language. */
  readonly language?: 'en' | 'vi';
  readonly writtenAt: Date;
}

/**
 * What the widgets draw, worked out by the app: an entry for the rest of this money day and one
 * from the next 04:00 (so the number turns over without the app), the look's colours for every
 * hour, and every word in the app's language. Before the month is set up there are no entries
 * and the widgets ask to open 6pm.
 */
export function surfaceSnapshot(input: SnapshotInput): SurfaceSnapshot {
  const { money, look, t } = input;
  const format = input.format ?? moneyFormat(moneyLocale(VND, input.language ?? 'en'));
  const today = dayOf(money);
  const pending = pendingCount(money);
  const list = rowsOf(money, format);
  const entries: Entry[] = [];
  if (today !== null) {
    entries.push(entryOf(today, moneyDayStart(money.today), list, pending, t, format));
    const next = nextMoneyDay(money);
    const tomorrow = dayOf(next);
    if (tomorrow !== null) {
      entries.push(
        entryOf(tomorrow, moneyDayStart(next.today), { rows: [], total: 0 }, pending, t, format),
      );
    }
  }
  return {
    v: SURFACES_VERSION,
    writtenAt: input.writtenAt.toISOString(),
    maxLook: input.maxLook,
    serious: look.serious,
    entries,
    palettes: hourlyPalettes(look),
    strings: {
      safeToSpend: t('today.safeToSpend'),
      safeTodayShort: t('surfaces.safeTodayShort'),
      brandSafe: t('surfaces.brandSafe'),
      left: t('surfaces.left'),
      today: t('surfaces.today'),
      scanQr: t('surfaces.scanQr'),
      quickAdd: t('home.quickAdd'),
      pendingTag: t('today.row.pending'),
      listEmpty: t('surfaces.listEmpty'),
      openApp: t('surfaces.openApp'),
      setUp: t('surfaces.setUp'),
      'glyph.scan': glyphOf('qr_code_scanner'),
      'glyph.add': glyphOf('add'),
      'font.display': displayFamily(look),
      ...tileColours(list.hues),
    },
  };
}

/** The snapshot without its write time: two snapshots that draw the same compare equal. */
export function snapshotKey(snapshot: SurfaceSnapshot): string {
  return JSON.stringify({ ...snapshot, writtenAt: '' });
}
