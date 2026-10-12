import { formatShort } from '@6pm/domain';

/** One everyday spend in the leak calculator. `hue` tints its tile. */
export interface Habit {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  /** Price of one, in đồng. */
  readonly price: number;
  readonly per: 'week' | 'month';
  readonly hue: number;
  /** How many the calculator starts with. */
  readonly start: number;
}

export const habits: readonly Habit[] = [
  {
    id: 'coffee',
    icon: 'local_cafe',
    label: 'Coffee out',
    price: 45000,
    per: 'week',
    hue: 25,
    start: 5,
  },
  {
    id: 'grab',
    icon: 'two_wheeler',
    label: 'Grab rides',
    price: 40000,
    per: 'week',
    hue: 220,
    start: 6,
  },
  {
    id: 'tea',
    icon: 'emoji_food_beverage',
    label: 'Trà sữa',
    price: 50000,
    per: 'week',
    hue: 340,
    start: 2,
  },
  {
    id: 'snack',
    icon: 'bakery_dining',
    label: 'Snacks & bánh mì',
    price: 20000,
    per: 'week',
    hue: 55,
    start: 7,
  },
  {
    id: 'out',
    icon: 'local_bar',
    label: 'Nights out',
    price: 350000,
    per: 'week',
    hue: 290,
    start: 1,
  },
  {
    id: 'shop',
    icon: 'shopping_bag',
    label: 'Shopee orders',
    price: 250000,
    per: 'month',
    hue: 20,
    start: 3,
  },
];

/** The most of one habit the calculator counts. */
export const habitMax = 30;

/** A week's spends count 4.33 times a month, as the design counts them. */
const weeksPerMonth = 4.33;

export type HabitCounts = Readonly<Record<string, number>>;

export const startCounts: HabitCounts = Object.fromEntries(habits.map((h) => [h.id, h.start]));

/** The monthly leak in đồng, unrounded. */
export function leakPerMonth(counts: HabitCounts): number {
  return habits.reduce(
    (sum, h) => sum + h.price * (counts[h.id] ?? 0) * (h.per === 'week' ? weeksPerMonth : 1),
    0,
  );
}

/** What a year of this leak would have bought. */
export function leakEquivalent(perMonth: number): string {
  const year = perMonth * 12;
  if (year >= 60e6) return 'a year of rent in Saigon';
  if (year >= 30e6) return 'a week in Japan';
  if (year >= 15e6) return 'a trip to Phú Quốc for two';
  if (year >= 6e6) return 'a new phone';
  return 'a mountain of bánh mì';
}

export function countLabel(habit: Habit, count: number): string {
  return `${count}× a ${habit.per}`;
}

export function priceLabel(habit: Habit): string {
  return `${formatShort(habit.price, 'en')} each`;
}

/** The design's tile and glyph inks for a hue. */
export function tileInks(hue: number): { readonly tile: string; readonly glyph: string } {
  return { tile: `oklch(0.86 0.08 ${hue})`, glyph: `oklch(0.36 0.1 ${hue})` };
}
