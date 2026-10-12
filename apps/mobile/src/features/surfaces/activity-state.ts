import { formatShort, formatVnd, SURFACES_VERSION, type SpendRow } from '@6pm/domain';
import type { Language } from '@6pm/i18n';
import { planInk, type Palette } from '@6pm/theme';

import type { I18n } from '../../i18n/i18n';

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
  /** "45k", beside the companion in the compact island. */
  readonly short: string;
  readonly paid: string;
  /** Where a tap outside the Paid button goes: the spend's details. */
  readonly path: string;
  /** The companion's picture in the App Group, or null in serious mode (no companion). */
  readonly companion: 'calm' | null;
  readonly accent: string;
  readonly onAccent: string;
}

/**
 * Travel mode, abroad: "Bangkok · today", "฿560 left", the day's spend against its line in the
 * local currency and in đồng. The view ships with the widgets; Travel starts it.
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
}

export function pendingPayState(
  spend: Pick<SpendRow, 'id' | 'amount' | 'merchant'>,
  context: {
    readonly t: I18n['t'];
    readonly language: Language;
    readonly palette: Palette;
    readonly serious: boolean;
  },
): PendingPayState {
  const { t, language, palette, serious } = context;
  return {
    v: SURFACES_VERSION,
    spendId: spend.id,
    caption: t('surfaces.activity.waiting'),
    title: t('surfaces.activity.to', { amount: formatVnd(spend.amount), merchant: spend.merchant }),
    short: formatShort(spend.amount, language),
    paid: t('surfaces.activity.paid'),
    path: `/app/spend/${encodeURIComponent(spend.id)}`,
    companion: serious ? null : 'calm',
    accent: palette.accent,
    onAccent: planInk.onAccent,
  };
}
