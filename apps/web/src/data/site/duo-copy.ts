/**
 * What the iPhone Duo section says, and what its phone screens print, in one language. Amounts on
 * the screens are kept in thousands of đồng (see `duo-data.ts`) and written out by `duoMoney`.
 */
export interface DuoCopy {
  readonly title: string;
  readonly sub: string;
  /** Folded, open, diary, propped up. */
  readonly tabs: readonly [string, string, string, string];
  /** The gestures each pose answers to: icon and line. */
  readonly hints: readonly (readonly (readonly [icon: string, line: string])[])[];
  readonly captions: readonly [string, string, string, string];
  /** Labels the stage for people who cannot see it. */
  readonly stageLabel: string;
  /** The đồng sign beside the big number; empty where the money carries its own sign. */
  readonly unit: string;
  readonly screen: DuoScreenCopy;
}

/** Category names for the screens' spend kinds. */
export type DuoKind = 'food' | 'ride' | 'coffee' | 'shop' | 'fun';

export interface DuoScreenCopy {
  readonly day: string;
  readonly date: string;
  readonly safe: string;
  readonly spent: (amount: string) => string;
  readonly ofToday: (amount: string) => string;
  readonly buddy: string;
  readonly closeTitle: string;
  readonly closeSub: string;
  readonly closeButton: string;
  readonly foldHint: string;
  readonly closeShort: string;
  readonly today: string;
  /** Today's four spends: name and where they came from, in the order of `duoRows`. */
  readonly rows: readonly (readonly [name: string, meta: string])[];
  readonly islandLabel: string;
  readonly tabs: readonly [string, string, string];
  readonly month: string;
  readonly payday: string;
  readonly paceTitle: string;
  readonly paceSub: string;
  readonly pots: readonly [string, string, string];
  readonly daily: string;
  readonly week: readonly string[];
  readonly todayNumber: string;
  readonly kinds: Readonly<Record<DuoKind, string>>;
  readonly split: string;
  readonly notMine: string;
  readonly diary: {
    readonly kicker: string;
    readonly title: string;
    readonly sub: string;
    readonly kept: string;
    /** Thursday first: 1 October 2026 is a Thursday. */
    readonly weekdays: readonly string[];
    readonly label: (weekday: string, day: number, tail: string) => string;
    readonly closedAt: (time: string) => string;
    readonly stillOpen: string;
    readonly notClosed: string;
    readonly stamp: string;
    readonly missedTitle: string;
    readonly missedSub: string;
    readonly missedButton: string;
    readonly openNote: string;
    readonly under: (amount: string) => string;
    readonly over: (amount: string) => string;
    readonly ofSoFar: (amount: string) => string;
    readonly ofThatDay: (amount: string) => string;
    /** The names of each closed day's three spends, by day of the month. */
    readonly items: Readonly<Record<number, readonly [string, string, string]>>;
  };
  readonly stand: {
    readonly place: string;
    readonly done: string;
    readonly left: string;
    readonly add: string;
    readonly categories: readonly [string, string, string, string];
    readonly recent: readonly [string, string];
  };
}
