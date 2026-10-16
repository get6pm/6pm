import type { SiteLang } from './copy';
import type { DuoKind } from './duo-copy';

/**
 * The made-up October behind the iPhone Duo screens, the same in both languages. Amounts are in
 * thousands of đồng; `duoMoney` writes them in each market's money.
 */

/** Tile background, glyph colour and icon for each kind of spend. */
export const duoKinds: Readonly<
  Record<DuoKind, readonly [tile: string, glyph: string, icon: string]>
> = {
  food: ['#ffd9b8', '#a4481f', 'restaurant'],
  ride: ['#cfe3ff', '#2d5ea8', 'local_taxi'],
  coffee: ['#f1dccb', '#7a4a2a', 'local_cafe'],
  shop: ['#dff0d4', '#3f7a3a', 'shopping_basket'],
  fun: ['#ecdcff', '#6a3fb0', 'confirmation_number'],
};

/** Today's spends, Friday 9 October, before the close. */
export const duoRows: readonly (readonly [kind: DuoKind, amount: number])[] = [
  ['ride', 48],
  ['food', 65],
  ['coffee', 55],
  ['shop', 32],
];

/** Today: what is left, what it started at, what went. */
export const duoToday = { left: 412, start: 612, spent: 200, daily: 520, kept: 530 } as const;

/** What each closed day spent, and when it was closed. 7 October slipped by; 9 October is today. */
export const duoSpent: Readonly<Record<number, number>> = {
  1: 410,
  2: 655,
  3: 380,
  4: 290,
  5: 470,
  6: 505,
  8: 360,
};
export const duoClosedAt: Readonly<Record<number, string>> = {
  1: '18:04',
  2: '18:21',
  3: '19:02',
  4: '18:00',
  5: '18:10',
  6: '18:33',
  8: '18:04',
};

/** Each closed day's three spends: kind and amount, in the order of the diary's names. */
export const duoDiary: Readonly<Record<number, readonly (readonly [DuoKind, number])[]>> = {
  1: [
    ['food', 45],
    ['ride', 62],
    ['shop', 303],
  ],
  2: [
    ['food', 320],
    ['fun', 180],
    ['ride', 155],
  ],
  3: [
    ['food', 65],
    ['fun', 240],
    ['coffee', 75],
  ],
  4: [
    ['shop', 210],
    ['coffee', 35],
    ['ride', 45],
  ],
  5: [
    ['food', 55],
    ['ride', 96],
    ['shop', 319],
  ],
  6: [
    ['food', 60],
    ['coffee', 55],
    ['fun', 390],
  ],
  8: [
    ['food', 40],
    ['coffee', 65],
    ['shop', 255],
  ],
};

/** Bills, Future you and Fun this month, with their colours. */
export const duoPots: readonly (readonly [amount: number, color: string])[] = [
  [2400, '#7a8bd8'],
  [1100, '#5fb08a'],
  [640, '#ff8552'],
];

/** The stand's quick-add categories' icons, and the two spends already added there. */
export const duoStandIcons = [
  'shopping_basket',
  'restaurant',
  'two_wheeler',
  'confirmation_number',
] as const;
export const duoStandRecent = [40, 15] as const;

/**
 * A screen amount in each market's money: thousands of đồng with `k` (and `tr` from a million) in
 * Vietnamese; in English a tenth of it in dollars, with cents under $20.
 */
export function duoMoney(lang: SiteLang, thousands: number): string {
  if (lang === 'vi') {
    if (thousands < 1000) return `${thousands}k`;
    return `${(thousands / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  }
  const dollars = thousands / 10;
  return thousands < 200
    ? `$${dollars.toFixed(2)}`
    : `$${Math.round(dollars).toLocaleString('en-US')}`;
}
