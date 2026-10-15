import { addDays, diffDays, type LocalDate } from '../time/local-date';
import { billFacts, paydayFacts, todayFacts, waitingFacts, workFacts } from './day-facts';
import {
  merchantKey,
  slotsOf,
  type Fact,
  type FactKind,
  type FactTone,
  type InsightInput,
} from './fact';
import {
  biggestSpendFacts,
  categoryPaceFacts,
  firstTimeFacts,
  repeatMerchantFacts,
} from './pattern-facts';
import { closeStreakFacts, potFacts, underStreakFacts, weekFacts } from './streak-facts';
import { cycleHalfwayFacts, firstWeekPaceFacts, paceFacts } from './cycle-facts';
import {
  lateNightFacts,
  likelySubscriptionFacts,
  recordDayFacts,
  weekendHeavyFacts,
} from './habit-facts';
import { backUnderFacts, logGapFacts, noSpendFacts } from './quiet-facts';

/** Good news that does not rest on what was logged: still true when the log has gone quiet. */
const PRAISE_WITHOUT_LOG: ReadonlySet<FactKind> = new Set([
  'closeStreak',
  'paydaySoon',
  'potMilestone',
  'potFull',
]);

/**
 * Every fact true right now, in no particular order. While nothing has been logged for days, good
 * news read from spending is left out: a quiet log is more likely forgotten than frugal.
 */
export function collectFacts(input: InsightInput): Fact[] {
  const gap = logGapFacts(input);
  const facts = [
    ...todayFacts(input),
    ...waitingFacts(input),
    ...paydayFacts(input),
    ...billFacts(input),
    ...workFacts(input),
    ...categoryPaceFacts(input),
    ...repeatMerchantFacts(input),
    ...firstTimeFacts(input),
    ...biggestSpendFacts(input),
    ...closeStreakFacts(input),
    ...underStreakFacts(input),
    ...weekFacts(input),
    ...potFacts(input),
    ...noSpendFacts(input),
    ...backUnderFacts(input),
    ...weekendHeavyFacts(input),
    ...recordDayFacts(input),
    ...likelySubscriptionFacts(input),
    ...lateNightFacts(input),
    ...cycleHalfwayFacts(input),
    ...firstWeekPaceFacts(input),
    ...paceFacts(input),
  ];
  if (gap.length === 0) return facts;
  return [...gap, ...facts.filter((f) => f.tone !== 'good' || PRAISE_WITHOUT_LOG.has(f.kind))];
}

/**
 * Where the companion speaks:
 * - `today`: the bubble on Today,
 * - `capture`: the toast after a spend is caught,
 * - `close`: the close's reveal and receipt note,
 * - `week`: the week recap and the diary's notes,
 * - `reminder`: the close reminder notification.
 */
export type Moment = 'today' | 'capture' | 'close' | 'week' | 'reminder';

const MOMENT_KINDS: Readonly<Record<Moment, ReadonlySet<FactKind>>> = {
  today: new Set<FactKind>([
    'todayOver',
    'todayUnder',
    'noSpendYet',
    'paydaySoon',
    'billDue',
    'categoryPace',
    'repeatMerchant',
    'underStreak',
    'closeStreak',
    'potMilestone',
    'potFull',
    'workToClaim',
    'noSpendDay',
    'noSpendStreak',
    'backUnder',
    'logGap',
    'weekendHeavy',
    'likelySubscription',
    'lateNight',
    'cycleHalfway',
    'firstWeekPace',
    'paceSpare',
    'paceShort',
  ]),
  capture: new Set<FactKind>([
    'repeatMerchant',
    'firstTimeMerchant',
    'biggestSpend',
    'categoryPace',
    'todayOver',
    'recordDay',
    'likelySubscription',
    'lateNight',
  ]),
  close: new Set<FactKind>([
    'todayUnder',
    'todayOver',
    'underStreak',
    'closeStreak',
    'weekSpare',
    'weekOver',
    'biggestSpend',
    'potMilestone',
    'potFull',
    'noSpendDay',
    'noSpendStreak',
    'backUnder',
    'recordDay',
  ]),
  week: new Set<FactKind>([
    'weekSpare',
    'weekOver',
    'repeatMerchant',
    'categoryPace',
    'biggestSpend',
    'noSpendStreak',
    'weekendHeavy',
    'likelySubscription',
    'paceSpare',
    'paceShort',
  ]),
  reminder: new Set<FactKind>([
    'logGap',
    'waitingTonight',
    'todayOver',
    'todayUnder',
    'billDue',
    'paydaySoon',
  ]),
};

/** A fact the companion has said: the companion's memory, kept in settings on the phone. */
export interface SaidFact {
  readonly key: string;
  readonly tone: FactTone;
  readonly on: LocalDate;
  /** The first day it may be said again. */
  readonly until: LocalDate;
}

/** The memory never holds more than this many facts; the oldest go first. */
const MEMORY_LIMIT = 200;

export interface PickInput {
  readonly moment: Moment;
  readonly facts: readonly Fact[];
  readonly memory: readonly SaidFact[];
  readonly today: LocalDate;
  /** Today is at or under its line: no "watch" fact spoils a good day. */
  readonly underToday: boolean;
  /** After a capture: the merchant just caught. Merchant facts about other places stay quiet. */
  readonly focusMerchant?: string;
}

function merchantOf(fact: Fact): string | null {
  const slot = slotsOf(fact)['merchant'];
  return slot?.type === 'merchant' ? merchantKey(slot.value) : null;
}

/**
 * The one fact worth saying at this moment, or null to keep the current line. Rules, in order:
 * the moment allows the kind; it was not said within its repeat window; at most one "watch" a
 * day, and none on a day under its line; after a capture, merchant facts are about that place.
 * The most salient wins; ties go to the key, so the choice is stable.
 */
export function pickFact(input: PickInput): Fact | null {
  const allowed = MOMENT_KINDS[input.moment];
  const blocked = new Set(input.memory.filter((m) => m.until > input.today).map((m) => m.key));
  const watchedToday = input.memory.some((m) => m.on === input.today && m.tone === 'watch');
  const focus = input.focusMerchant === undefined ? null : merchantKey(input.focusMerchant);

  const candidates = input.facts.filter((fact) => {
    if (!allowed.has(fact.kind) || blocked.has(fact.key)) return false;
    if (fact.tone === 'watch' && (watchedToday || input.underToday)) return false;
    if (focus !== null) {
      const merchant = merchantOf(fact);
      if (merchant !== null && merchant !== focus) return false;
    }
    return true;
  });
  candidates.sort((a, b) => b.salience - a.salience || a.key.localeCompare(b.key));
  return candidates[0] ?? null;
}

/** The memory after `fact` was said today, with expired and overflowing entries dropped. */
export function remember(memory: readonly SaidFact[], fact: Fact, today: LocalDate): SaidFact[] {
  const said: SaidFact = {
    key: fact.key,
    tone: fact.tone,
    on: today,
    until: addDays(today, Math.max(1, fact.repeatAfterDays)),
  };
  // Today's entries stay even when expired: the one-watch-a-day rule reads them.
  const kept = memory.filter(
    (m) => m.key !== fact.key && (m.until > today || diffDays(today, m.on) === 0),
  );
  return [...kept, said].slice(-MEMORY_LIMIT);
}
