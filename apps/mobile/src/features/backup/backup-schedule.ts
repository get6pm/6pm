const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** However many days close, a backup is never sent twice within this long. */
export const MIN_GAP_MS = HOUR_MS;

/**
 * Whether the automatic backup is due: once after a day is closed, and otherwise once a day, so
 * the server copy is never more than a day behind. A late close that files yesterday still counts
 * as a close since the last backup. `latestClosedAt` is when the most recent day was closed.
 */
export function backupIsDue(input: {
  readonly now: number;
  readonly lastAt: number | null;
  readonly latestClosedAt: number | null;
}): boolean {
  const { now, lastAt, latestClosedAt } = input;
  if (lastAt === null) return true;
  if (now - lastAt < MIN_GAP_MS) return false;
  if (latestClosedAt !== null && latestClosedAt > lastAt) return true;
  return now - lastAt >= DAY_MS;
}
