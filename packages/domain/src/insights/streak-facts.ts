import type { ClosedDayTotal } from '../diary/calendar';
import { dayDot } from '../diary/calendar';
import { weekRecap } from '../diary/week-recap';
import { addDays, startOfWeek } from '../time/local-date';
import { countSlot, moneySlot, type Fact, type InsightInput } from './fact';

/** Streak lengths worth a bigger word than the rest. */
const STREAK_MILESTONES = new Set([7, 14, 21, 30, 60, 100]);
const MIN_CLOSE_STREAK = 3;
const MIN_UNDER_STREAK = 2;
/** Pot milestones, in percent of the goal. Full is its own fact. */
const POT_MILESTONES = [25, 50, 75] as const;

/**
 * Closed days running back from today (when today is closed) or from yesterday, each passing
 * `keep`. A day not closed ends the run.
 */
function runBack(
  closed: readonly ClosedDayTotal[],
  today: string,
  keep: (day: ClosedDayTotal) => boolean,
): number {
  const byDay = new Map(closed.map((d) => [d.day, d]));
  let day = byDay.has(today) ? today : addDays(today, -1);
  let run = 0;
  for (let row = byDay.get(day); row !== undefined && keep(row); row = byDay.get(day)) {
    run += 1;
    day = addDays(day, -1);
  }
  return run;
}

export function closeStreakFacts(input: InsightInput): Fact[] {
  const days = runBack(input.closed, input.today, () => true);
  if (days < MIN_CLOSE_STREAK) return [];
  const milestone = STREAK_MILESTONES.has(days);
  return [
    {
      kind: 'closeStreak',
      key: `closeStreak:${days}`,
      tone: 'good',
      salience: milestone ? 0.75 : Math.min(0.6, 0.4 + 0.02 * days),
      repeatAfterDays: 1,
      slots: { days: countSlot(days) },
    },
  ];
}

/** Closed days in a row at or under their line. */
export function underStreakFacts(input: InsightInput): Fact[] {
  const days = runBack(input.closed, input.today, (d) => dayDot(d.spent, d.line) === 'under');
  if (days < MIN_UNDER_STREAK) return [];
  return [
    {
      kind: 'underStreak',
      key: `underStreak:${days}`,
      tone: 'good',
      salience: STREAK_MILESTONES.has(days) ? 0.7 : Math.min(0.6, 0.4 + 0.03 * days),
      repeatAfterDays: 1,
      slots: { days: countSlot(days) },
    },
  ];
}

/** The week's closed days, as the Diary's recap tells them: money left over, or over. */
export function weekFacts(input: InsightInput): Fact[] {
  const from = startOfWeek(input.today);
  const { story } = weekRecap({
    today: input.today,
    line: input.day.line,
    closed: input.closed.filter((d) => d.day >= from && d.day <= input.today),
    spends: input.spends.filter((s) => s.day >= from && s.day <= input.today),
    notDaily: input.notDaily,
  });
  if (story.kind === 'under') {
    return [
      {
        kind: 'weekSpare',
        key: `weekSpare:${from}:${story.days}`,
        tone: 'good',
        salience: 0.5,
        repeatAfterDays: 1,
        slots: { days: countSlot(story.days), spare: moneySlot(story.spare) },
      },
    ];
  }
  if (story.kind === 'over') {
    return [
      {
        kind: 'weekOver',
        key: `weekOver:${from}`,
        tone: 'watch',
        salience: 0.45,
        repeatAfterDays: 3,
        slots: { over: moneySlot(story.over) },
      },
    ];
  }
  return [];
}

/** A pot full, or past a quarter, half or three quarters of its goal. Each is told once. */
export function potFacts(input: InsightInput): Fact[] {
  const facts: Fact[] = [];
  for (const pot of input.pots) {
    if (pot.goal <= 0 || pot.saved <= 0) continue;
    const slot = { type: 'pot', id: pot.id, name: pot.name } as const;
    if (pot.saved >= pot.goal) {
      facts.push({
        kind: 'potFull',
        key: `potFull:${pot.id}:${pot.goal}`,
        tone: 'good',
        salience: 0.85,
        repeatAfterDays: 3650,
        slots: { pot: slot },
      });
      continue;
    }
    const percent = POT_MILESTONES.filter((m) => pot.saved * 100 >= pot.goal * m).at(-1);
    if (percent === undefined) continue;
    facts.push({
      kind: 'potMilestone',
      key: `potMilestone:${pot.id}:${pot.goal}:${percent}`,
      tone: 'good',
      salience: 0.5 + percent / 500,
      repeatAfterDays: 3650,
      slots: { pot: slot, percent: countSlot(percent) },
    });
  }
  return facts;
}
