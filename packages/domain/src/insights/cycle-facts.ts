import { floorToThousand } from '../money/format';
import { addDays, diffDays } from '../time/local-date';
import {
  compareAmounts,
  countedSpends,
  countSlot,
  dateSlot,
  moneySlot,
  type Fact,
  type InsightInput,
} from './fact';

/** Days of the cycle a halfway word stays fresh. */
const HALFWAY_DAYS = 3;
const FIRST_WEEK = 7;
/** The first week is told on these days after it, not later. */
const FIRST_WEEK_TOLD_FOR = 3;
/** A cycle shorter than this has no first week worth comparing. */
const MIN_CYCLE_DAYS = 20;
/** Days of spending a pace is measured on, at the least. */
const MIN_PACE_DAYS = 7;
/** A pace word needs this many days still to go. */
const MIN_DAYS_LEFT = 3;

interface CycleMoney {
  /** Days this cycle's money covers, its start through payday. */
  readonly length: number;
  /** Whole days of the cycle before today. */
  readonly elapsed: number;
  /** Counted before today. */
  readonly spentBefore: number;
  /** The cycle's free money: what was free at its start. */
  readonly total: number;
}

function cycleMoney(input: InsightInput): CycleMoney {
  const { cycle, today, day } = input;
  const spentBefore = countedSpends(input, cycle.start, addDays(today, -1)).reduce(
    (sum, s) => sum + s.amount,
    0,
  );
  return {
    length: diffDays(cycle.payday, cycle.start) + 1,
    elapsed: diffDays(today, cycle.start),
    spentBefore,
    total: day.startFree + spentBefore,
  };
}

const percentOf = (part: number, whole: number) => Math.round((part * 100) / whole);

/** Just past the cycle's middle: how much of its free money is used, and what is left. */
export function cycleHalfwayFacts(input: InsightInput): Fact[] {
  const { length, elapsed, spentBefore, total } = cycleMoney(input);
  const middle = Math.ceil(length / 2);
  if (length < MIN_CYCLE_DAYS || elapsed < middle || elapsed >= middle + HALFWAY_DAYS) return [];
  if (total <= 0 || input.day.free < 0) return [];
  const percent = percentOf(spentBefore + input.day.spent, total);
  const time = percentOf(elapsed, length);
  return [
    {
      kind: 'cycleHalfway',
      key: `cycleHalfway:${input.cycle.start}`,
      tone: percent <= time ? 'good' : percent >= time + 15 ? 'watch' : 'neutral',
      salience: 0.5,
      repeatAfterDays: 30,
      slots: { percent: countSlot(percent), left: moneySlot(input.day.free) },
    },
  ];
}

/** The first seven days against an even share of the cycle, told just after they end. */
export function firstWeekPaceFacts(input: InsightInput): Fact[] {
  const { length, elapsed, total } = cycleMoney(input);
  if (length < MIN_CYCLE_DAYS || total <= 0) return [];
  if (elapsed < FIRST_WEEK || elapsed >= FIRST_WEEK + FIRST_WEEK_TOLD_FOR) return [];
  const { start } = input.cycle;
  const week = countedSpends(input, start, addDays(start, FIRST_WEEK - 1)).reduce(
    (sum, s) => sum + s.amount,
    0,
  );
  const even = (total * FIRST_WEEK) / length;
  const word = compareAmounts(week, even);
  if (word === 'about') return [];
  const more = word === 'more' || word === 'muchMore';
  return [
    {
      kind: 'firstWeekPace',
      key: `firstWeekPace:${start}`,
      tone: more ? 'watch' : 'good',
      salience: 0.5,
      repeatAfterDays: 30,
      slots: {
        percent: countSlot(percentOf(week, total)),
        even: countSlot(percentOf(FIRST_WEEK, length)),
        compare: { type: 'compare', value: word },
      },
    },
  ];
}

/**
 * Where the cycle lands at the average pace of its days so far: money to spare at payday (at least
 * a day's line), or the day it would run out before payday. Told at most once a week.
 */
export function paceFacts(input: InsightInput): Fact[] {
  const { cycle, day, today } = input;
  const { elapsed, spentBefore } = cycleMoney(input);
  if (elapsed < MIN_PACE_DAYS || cycle.daysLeft < MIN_DAYS_LEFT || day.free < 0) return [];
  const pace = spentBefore / elapsed;
  const landing = day.free - pace * cycle.daysLeft;
  const payday = dateSlot(cycle.payday);
  if (landing >= Math.max(day.line, 1)) {
    return [
      {
        kind: 'paceSpare',
        key: `paceSpare:${cycle.start}`,
        tone: 'good',
        salience: 0.45,
        repeatAfterDays: 7,
        slots: { spare: moneySlot(floorToThousand(landing)), payday },
      },
    ];
  }
  if (landing >= 0 || pace <= 0) return [];
  // The money lasts this many whole days after today; it runs out the day after.
  const runsOut = addDays(today, Math.floor(day.free / pace) + 1);
  if (runsOut >= cycle.payday) return [];
  return [
    {
      kind: 'paceShort',
      key: `paceShort:${cycle.start}`,
      tone: 'watch',
      salience: 0.6,
      repeatAfterDays: 7,
      slots: { runsOut: dateSlot(runsOut), payday },
    },
  ];
}
