import { z } from 'zod';

import { DEFAULT_CLOSE_AT } from '@6pm/domain';

import type { SqlDatabase } from './table';

/** The user's month, as onboarding and the Plan tab set it. Kept as one JSON setting. */
export const planSettingsSchema = z.object({
  income: z.number().int().nonnegative(),
  payday: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('sameDay'), day: z.number().int().min(1).max(31) }),
    z.object({ kind: z.literal('lastDay') }),
    z.object({ kind: z.literal('varies') }),
  ]),
  /** Future you, paid first each payday. */
  futureYou: z.number().int().nonnegative(),
  closeAt: z.string().regex(/^\d{2}:\d{2}$/),
  persona: z.enum(['soft', 'cheeky', 'roast']),
  serious: z.boolean(),
});
export type PlanSettings = z.infer<typeof planSettingsSchema>;

export const DEFAULT_PLAN: PlanSettings = {
  income: 0,
  payday: { kind: 'lastDay' },
  futureYou: 0,
  closeAt: DEFAULT_CLOSE_AT,
  persona: 'cheeky',
  serious: false,
};

const KEY = 'plan';

export async function readPlan(db: SqlDatabase): Promise<PlanSettings | null> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    KEY,
  ]);
  const raw = rows[0]?.value;
  if (raw === undefined) return null;
  const parsed = planSettingsSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export async function writePlan(db: SqlDatabase, plan: PlanSettings): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    KEY,
    JSON.stringify(planSettingsSchema.parse(plan)),
  ]);
}
