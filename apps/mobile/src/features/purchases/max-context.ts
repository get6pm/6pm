import { z } from 'zod';

import type { CompanionForm } from '../../ui/companion/companion-mood';

/** Where Max was offered from: each gate in the app opens the sheet with its own reason. */
export const MAX_FROM = [
  'looks',
  'ask',
  'pots',
  'travel',
  'backup',
  'diary',
  'widgets',
  'icons',
  'buddy',
] as const;
export type MaxFrom = (typeof MAX_FROM)[number];

const fromSchema = z.enum(MAX_FROM);
const maxCompanionSchema = z.enum(['max', 'hac'] as const satisfies readonly CompanionForm[]);

/** Reads the `from` route parameter; anything else opens the sheet for the looks. */
export function parseMaxFrom(raw: unknown): MaxFrom {
  const parsed = fromSchema.safeParse(Array.isArray(raw) ? raw[0] : raw);
  return parsed.success ? parsed.data : 'looks';
}

/** Reads the `companion` route parameter: a Max-only companion tapped in the picker, if any. */
export function parseMaxCompanion(raw: unknown): CompanionForm | undefined {
  const parsed = maxCompanionSchema.safeParse(Array.isArray(raw) ? raw[0] : raw);
  return parsed.success ? parsed.data : undefined;
}

/** The feature tiles in the order the design lists them. */
export const MAX_TILES = [
  'looks',
  'ask',
  'pots',
  'travel',
  'diary',
  'backup',
  'widgets',
  'icons',
  'buddy',
] as const satisfies readonly MaxFrom[];

/** The tile that opened the sheet comes first; the rest keep their order. */
export function tileOrder(from: MaxFrom): readonly MaxFrom[] {
  return [from, ...MAX_TILES.filter((tile) => tile !== from)];
}

/** Lays the tiles out two to a row, in order; an odd last tile sits alone on the left. */
export function tileRows(order: readonly MaxFrom[]): MaxFrom[][] {
  const rows: MaxFrom[][] = [];
  for (let i = 0; i < order.length; i += 2) rows.push(order.slice(i, i + 2));
  return rows;
}

export type WelcomeRoute =
  '/looks' | '/new-pot' | '/categories' | '/settings' | '/backup' | '/money-diary' | '/ask';

/** The welcome's button: which label key it takes, and the screen it opens (none: back to the day). */
export interface WelcomeAction {
  readonly label:
    'looks' | 'pots' | 'travel' | 'backup' | 'diary' | 'icons' | 'look' | 'ask' | null;
  readonly href: WelcomeRoute | null;
}

const ROUTES: Readonly<Partial<Record<MaxFrom, WelcomeAction>>> = {
  looks: { label: 'looks', href: '/looks' },
  ask: { label: 'ask', href: '/ask' },
  pots: { label: 'pots', href: '/new-pot' },
  travel: { label: 'travel', href: '/settings' },
  backup: { label: 'backup', href: '/backup' },
  diary: { label: 'diary', href: '/money-diary' },
  icons: { label: 'icons', href: '/categories' },
};

/**
 * Where the welcome's button leads. A look that was being tried on is already worn, so the
 * button is "See it on my day". Gates with no screen of their own (widgets, the companion) have
 * nothing to open: the label is null and the only way on is back to the day.
 */
export function welcomeAction(from: MaxFrom, triedLook: boolean): WelcomeAction {
  if (triedLook) return { label: 'look', href: null };
  return ROUTES[from] ?? { label: null, href: null };
}
