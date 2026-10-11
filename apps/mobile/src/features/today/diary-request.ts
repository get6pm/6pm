import { useSyncExternalStore } from 'react';

import type { LocalDate } from '@6pm/domain';

/**
 * A request, from outside the Diary tab, to show one day's receipt there (the week strip and the
 * closed card on Today). Each request has its own token so asking for the same day twice, after
 * browsing elsewhere in the Diary, still selects it again.
 */
export interface DiaryRequest {
  readonly day: LocalDate;
  readonly token: number;
}

let current: DiaryRequest | null = null;
let counter = 0;
const listeners = new Set<() => void>();

export function requestDiaryDay(day: LocalDate): void {
  counter += 1;
  current = { day, token: counter };
  for (const listener of listeners) listener();
}

export function useDiaryRequest(): DiaryRequest | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
