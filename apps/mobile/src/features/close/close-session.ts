import { useSyncExternalStore } from 'react';

import type { CloseState, LocalDate } from '@6pm/domain';

import type { CashChip } from './close-steps';

/**
 * Where a close was left. Leaving the close parks it here rather than throwing the step away, so
 * Today can offer "Resume" and reopening picks up at the same step. It lives for as long as the
 * app does: every decision already made is saved in the database, so a relaunch starts a fresh
 * close over whatever is still waiting.
 */
export interface CloseSession {
  /** The money day being closed. A session for another day is not resumed. */
  readonly day: LocalDate;
  readonly state: CloseState;
  /** The spends the close opened with, in order. */
  readonly queueIds: readonly string[];
  /** Cash added so far, shown again on the cash step. */
  readonly cash: readonly CashChip[];
}

let session: CloseSession | null = null;
const listeners = new Set<() => void>();

function set(next: CloseSession | null): void {
  session = next;
  for (const listener of listeners) listener();
}

export function parkClose(next: CloseSession): void {
  set(next);
}

export function clearClose(): void {
  if (session !== null) set(null);
}

/** The parked close for `day`, if there is one. */
export function parkedClose(day: LocalDate): CloseSession | null {
  return session !== null && session.day === day ? session : null;
}

/** The parked close for `day`, kept up to date for the screen showing it. */
export function useParkedClose(day: LocalDate): CloseSession | null {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => session,
  );
  return current !== null && current.day === day ? current : null;
}
