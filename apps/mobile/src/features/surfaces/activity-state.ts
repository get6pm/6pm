import {
  foreignAmountText,
  SURFACES_VERSION,
  tripDay,
  type DailyNumber,
  type MoneyFormat,
  type PhoneNumberStyle,
  type SpendRow,
} from '@6pm/domain';
import { planInk, type Palette } from '@6pm/theme';

import type { I18n } from '../../i18n/i18n';
import type { Trip } from '../travel/trip';
import { glyphOf } from './surface-snapshot';

/**
 * What a Live Activity shows, as the JSON in its content state. Every word and number is worded by
 * the app in its language and every colour comes from the look; Swift only lays it out. The
 * activity's `key` is what it follows (the spend's id, the trip's id).
 */

/** A QR payment handed to a bank and not confirmed yet: "Waiting · tap when paid". */
export interface PendingPayState {
  readonly v: typeof SURFACES_VERSION;
  readonly spendId: string;
  readonly caption: string;
  /** "45.000₫ to Phở Hòa". */
  readonly title: string;
  /** The amount in pieces, so the Lock Screen sets the symbol smaller: "45.000" and "₫". */
  readonly amount: { readonly prefix: string; readonly number: string; readonly suffix: string };
  /** Under the amount: "to Phở Hòa · opened MB Bank", or "to Phở Hòa" without a bank. */
  readonly detail: string;
  /** The expanded island's caption: "Waiting · MB Bank", or `caption` without a bank. */
  readonly bankCaption: string;
  /** When the bank app was asked to open, for "2 min ago". */
  readonly since: string;
  /** "45k", beside the companion in the compact island. */
  readonly short: string;
  readonly paid: string;
  /** The tick drawn before "Paid", as its Material Symbols character. */
  readonly paidIcon: string;
  /** Where a tap outside the Paid button goes: the spend's details. */
  readonly path: string;
  /** The companion's mood (its pictures are in the App Group), or null in serious mode. */
  readonly companion: 'think' | null;
  readonly accent: string;
  readonly onAccent: string;
}

/**
 * Travel mode, abroad: "Bangkok · today", "฿560 left", the day's spend against its line in the
 * local currency and in the home currency. The view ships with the widgets; Travel starts it.
 */
export interface TravelState {
  readonly v: typeof SURFACES_VERSION;
  /** The Material Symbols glyph drawn in the accent, as its character (`glyphOf('flight')`). */
  readonly icon: string;
  readonly place: string;
  readonly left: string;
  readonly spent: string;
  readonly of: string;
  /** How much of the day's line is spent, 0 to 1. */
  readonly fraction: number;
  readonly path: string;
  readonly accent: string;
  /** What is left of the day (or how far over), large on the Lock Screen: "฿560". */
  readonly leftAmount: string;
  /** "left of ฿1.200 · ≈ 410.000₫", beside `leftAmount` on the Lock Screen. */
  readonly leftDetail: string;
  /** "left · ≈ 410.000₫", beside `leftAmount` in the expanded island. */
  readonly leftHome: string;
  /** "Log ฿": Quick add, which opens in the trip's currency. */
  readonly log: string;
  readonly logIcon: string;
  /** Ink on the accent, for Log. */
  readonly onAccent: string;
  readonly logPath: string;
}

export function pendingPayState(
  spend: Pick<SpendRow, 'id' | 'amount' | 'merchant' | 'at' | 'wallet'>,
  context: {
    readonly t: I18n['t'];
    /** Money in the home currency. */
    readonly format: MoneyFormat;
    readonly palette: Palette;
    readonly serious: boolean;
  },
): PendingPayState {
  const { t, format, palette, serious } = context;
  const { prefix, number, suffix } = format.parts(spend.amount);
  const bank = spend.wallet;
  return {
    v: SURFACES_VERSION,
    spendId: spend.id,
    caption: t('surfaces.activity.waiting'),
    title: t('surfaces.activity.to', {
      amount: format.full(spend.amount),
      merchant: spend.merchant,
    }),
    amount: { prefix, number, suffix: suffix.trim() },
    detail:
      bank === null
        ? t('surfaces.activity.toMerchant', { merchant: spend.merchant })
        : t('surfaces.activity.toMerchantBank', { merchant: spend.merchant, bank }),
    bankCaption:
      bank === null ? t('surfaces.activity.waiting') : t('surfaces.activity.waitingBank', { bank }),
    since: spend.at,
    short: format.short(spend.amount),
    paid: t('surfaces.activity.paid'),
    paidIcon: glyphOf('check'),
    path: `/app/spend/${encodeURIComponent(spend.id)}`,
    companion: serious ? null : 'think',
    accent: palette.accent,
    onAccent: planInk.onAccent,
  };
}

/**
 * The trip's activity: the place and what is left of today in its currency, the day's spend
 * against its line, and the spend in the home currency. Null until the trip has a rate (home
 * units for one unit of the trip's currency).
 */
export function travelState(
  trip: Trip,
  day: Pick<DailyNumber, 'line' | 'spent' | 'safe'>,
  context: {
    readonly t: I18n['t'];
    readonly palette: Palette;
    /** Money in the home currency. */
    readonly format: MoneyFormat;
    /** How the phone writes numbers, for the local amounts. */
    readonly phone?: PhoneNumberStyle;
  },
): TravelState | null {
  const { t, palette, format } = context;
  const home = format.currency;
  const today = trip.rate === null ? null : tripDay(day, trip.rate.rate, home);
  if (today === null) return null;
  const style = { home, language: format.locale.language, phone: context.phone ?? {} };
  const money = (whole: number) =>
    foreignAmountText({ currency: trip.currency.code, amount: whole }, style);
  const over = today.left < 0;
  const leftHome = format.full(Math.abs(day.safe));
  return {
    v: SURFACES_VERSION,
    icon: glyphOf('flight'),
    place: t('travel.activity.place', { place: trip.place.name }),
    left:
      today.left >= 0
        ? t('travel.activity.left', { amount: money(today.left) })
        : t('travel.activity.over', { amount: money(-today.left) }),
    spent: money(today.spent),
    of: t('travel.activity.of', { line: money(today.line), vnd: format.full(today.spentHome) }),
    fraction: today.fraction,
    path: '/',
    accent: palette.accent,
    leftAmount: money(Math.abs(today.left)),
    leftDetail: over
      ? t('travel.activity.overOf', { line: money(today.line), home: leftHome })
      : t('travel.activity.leftOf', { line: money(today.line), home: leftHome }),
    leftHome: over
      ? t('travel.activity.overHome', { home: leftHome })
      : t('travel.activity.leftHome', { home: leftHome }),
    log: t('travel.activity.log', { symbol: trip.currency.symbol }),
    logIcon: glyphOf('add'),
    onAccent: planInk.onAccent,
    logPath: '/app/quick-add',
  };
}
