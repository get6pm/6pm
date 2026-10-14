import { SURFACES_VERSION, type MerchantRuleRow, type SurfaceContext } from '@6pm/domain';
import { categoryTile } from '@6pm/theme';

import { dayOf, type MoneySnapshot } from '../../data/money-store';
import type { I18n } from '../../i18n/i18n';

/** The host of this build's links and API, from `extra.apiBase` (`https://<host>/api`). */
export function hostOf(apiBase: unknown): string | null {
  if (typeof apiBase !== 'string') return null;
  return /^https?:\/\/([^/?#]+)/i.exec(apiBase)?.[1] ?? null;
}

/**
 * The words the domain bundle fills in for the extensions' cards, in the app's language.
 * `safeAfter` keeps its `{amount}` for the domain to fill.
 */
export function contextStrings(t: I18n['t']): SurfaceContext['strings'] {
  return {
    today: t('surfaces.context.today'),
    yesterday: t('surfaces.context.yesterday'),
    safeAfter: t('surfaces.context.safeAfter', { amount: '{amount}' }),
  };
}

/**
 * What the share extension and the shortcuts file a spend with, without the database: the
 * categories and their tiles, the merchant rules the user taught, today's number, and the trip
 * and rates a foreign receipt is read and priced with.
 */
export function surfaceContext(input: {
  readonly money: MoneySnapshot;
  readonly rules: readonly MerchantRuleRow[];
  readonly language: SurfaceContext['language'];
  readonly host: string;
  readonly strings?: SurfaceContext['strings'];
  /** The trip's currency in Travel mode: the guess for a shared receipt that prints none. */
  readonly tripCurrency?: string | null;
  /** The last rates the app has, so a shared foreign receipt is priced as Travel prices it. */
  readonly rates?: readonly { readonly currency: string; readonly rate: string }[];
}): SurfaceContext {
  const { money } = input;
  return {
    v: SURFACES_VERSION,
    language: input.language,
    host: input.host,
    categories: money.categories.map((c) => {
      const tile = categoryTile(c.hue);
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        tile: tile.to,
        glyph: tile.glyph,
        countsDaily: c.countsDaily,
      };
    }),
    rules: input.rules.map((r) => ({ key: r.merchantKey, categoryId: r.categoryId })),
    safeToday: dayOf(money)?.safe ?? 0,
    strings: input.strings ?? {},
    travel: input.tripCurrency ? { currency: input.tripCurrency } : null,
    rates: (input.rates ?? []).map(({ currency, rate }) => ({ currency, rate })),
  };
}
