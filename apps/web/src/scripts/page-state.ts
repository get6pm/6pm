import { startCounts, type HabitCounts } from '../data/habits';

/** What the visitor has done on the page, shared by the calculator, both email forms and the dock. */
export interface PageState {
  readonly counts: HabitCounts;
  /** The visitor has changed the calculator, so the leak is theirs. */
  readonly touched: boolean;
  readonly email: string;
  readonly sending: boolean;
  /** The ticket number the list gave this email, once it is on the list. */
  readonly ticket: number | null;
  /** The line under the forms when something needs the visitor's attention. */
  readonly problem: string;
  /** The last try failed in a way that trying again can fix. */
  readonly canRetry: boolean;
}

let state: PageState = {
  counts: startCounts,
  touched: false,
  email: '',
  sending: false,
  ticket: null,
  problem: '',
  canRetry: false,
};

const listeners = new Set<(next: PageState) => void>();

export function pageState(): PageState {
  return state;
}

export function updatePage(patch: Partial<PageState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener(state);
}

/** Calls `listener` now and after every change. */
export function watchPage(listener: (next: PageState) => void): void {
  listeners.add(listener);
  listener(state);
}
