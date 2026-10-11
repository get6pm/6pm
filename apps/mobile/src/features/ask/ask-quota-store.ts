import { z } from 'zod';

import { addDays, startOfWeek, type LocalDate } from '@6pm/domain';

import type { SqlDatabase } from '../../data/table';

/** The settings key holding the money days questions were asked on. */
export const ASKED_ON_KEY = 'ask.askedOn';

/** Weeks of history kept: the current week is what counts, a few more survive a clock change. */
const KEEP_WEEKS = 4;

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const askedOnSchema = z.array(z.string().regex(dayPattern));

/** A damaged setting reads as no questions asked rather than throwing. */
function parse(raw: string | undefined): LocalDate[] {
  if (raw === undefined) return [];
  try {
    const parsed = askedOnSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** The money days free questions were asked on, oldest first. Stays on this phone. */
export async function readAskedOn(db: SqlDatabase): Promise<LocalDate[]> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    ASKED_ON_KEY,
  ]);
  return parse(rows[0]?.value);
}

/**
 * Counts one more question against `today`'s week and forgets days older than a few weeks.
 * Returns what is kept.
 */
export async function recordAsk(db: SqlDatabase, today: LocalDate): Promise<LocalDate[]> {
  const oldest = addDays(startOfWeek(today), -7 * KEEP_WEEKS);
  const kept = [...(await readAskedOn(db)), today].filter((day) => day >= oldest).sort();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    ASKED_ON_KEY,
    JSON.stringify(kept),
  ]);
  return kept;
}
