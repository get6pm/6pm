import {
  addDays,
  addMonthsTo,
  billDueIn,
  cyclePosition,
  diffDays,
  goalMonthly,
  goalPlan,
  joinedShare,
  moneyRiver,
  occasionsOf,
  weekdayMondayFirst,
  type BillRow,
  type DailyNumber,
  type GoalPlan,
  type LocalDate,
  type PotRow,
  type RiverSegment,
  type Vnd,
} from '@6pm/domain';

import type { CycleTopUps } from '../../data/plan-actions';
import type { MoneySnapshot } from '../../data/money-store';

/** The what-if slider: Future you from 0 to 4tr in 250k steps (further when the plan is above). */
export const WHAT_IF_STEP = 250_000;
export const WHAT_IF_MAX = 4_000_000;
/** The +100k buttons on goals and pots. */
export const TOP_UP = 100_000;

export function sliderMax(committed: Vnd): Vnd {
  return Math.max(WHAT_IF_MAX, Math.ceil(committed / WHAT_IF_STEP) * WHAT_IF_STEP);
}

/** Σ what the occasion pots set aside this pay cycle, as the daily number counts them. */
export function occasionsMonthly(snap: MoneySnapshot): Vnd {
  return occasionsOf(snap.pots, snap.setAsideThisCycle);
}

/** The pots a customer without Max can have of their own: one occasion pot. */
export const FREE_OCCASION_POTS = 1;

/** Whether New pot is behind the Max sheet: the free pot is used and Max is not held. */
export function newPotLocked(pots: readonly PotRow[], max: boolean): boolean {
  return !max && pots.filter((p) => p.kind === 'occasion').length >= FREE_OCCASION_POTS;
}

export function riverOf(
  snap: MoneySnapshot,
  day: DailyNumber,
  topUps: CycleTopUps | null,
): Readonly<Record<RiverSegment, Vnd>> {
  // Until the split is read, every top-up shows under Occasions; the total is right either way.
  const goalTopUps = topUps?.goal ?? 0;
  return moneyRiver({
    income: snap.plan?.income ?? 0,
    bills: snap.bills.reduce((sum, b) => sum + b.amount, 0),
    futureYou: snap.plan?.futureYou ?? 0,
    occasions: occasionsMonthly(snap),
    goalTopUps,
    occasionTopUps: snap.topUpsThisCycle - goalTopUps,
    free: day.free,
    share: joinedShare(snap.cycle, snap.plan?.startedOn ?? null),
  });
}

export interface BillView {
  readonly bill: BillRow;
  readonly due: LocalDate;
  readonly paid: boolean;
  /** Days from today to the due date; negative once it has passed. */
  readonly inDays: number;
  /** 0–1 along the cycle line. */
  readonly position: number;
}

export function billViews(snap: MoneySnapshot): BillView[] {
  return snap.bills.map((bill) => {
    const due = billDueIn(snap.cycle, bill.dueDay);
    return {
      bill,
      due,
      paid: bill.paidCycle === snap.cycle.start,
      inDays: diffDays(due, snap.today),
      position: cyclePosition(snap.cycle, due),
    };
  });
}

export interface GoalView {
  readonly pot: PotRow;
  readonly saved: Vnd;
  /** 0–1, capped at full. */
  readonly progress: number;
  readonly plan: GoalPlan;
}

export function goalViews(snap: MoneySnapshot): GoalView[] {
  const futureYou = snap.plan?.futureYou ?? 0;
  return snap.pots
    .filter((p) => p.kind === 'goal')
    .map((pot) => {
      const saved = snap.potSaved[pot.id] ?? 0;
      const monthly = pot.paused ? 0 : goalMonthly(futureYou, pot.share ?? 0);
      return {
        pot,
        saved,
        progress: pot.goal > 0 ? Math.min(1, saved / pot.goal) : 1,
        plan: goalPlan({
          goal: pot.goal,
          saved,
          monthly,
          neededBy: pot.neededBy,
          today: snap.today,
        }),
      };
    });
}

/** "60 / 40": how Future you is shared between the goals. */
export function shareSplit(goals: readonly GoalView[]): string | null {
  if (goals.length < 2) return null;
  return goals.map((g) => Math.round((g.pot.share ?? 0) * 100)).join(' / ');
}

export interface OccasionView {
  readonly pot: PotRow;
  readonly saved: Vnd;
  readonly progress: number;
  readonly full: boolean;
  readonly paused: boolean;
  /** What it sets aside this pay cycle. */
  readonly monthly: Vnd;
}

export function occasionViews(snap: MoneySnapshot): OccasionView[] {
  return snap.pots
    .filter((p) => p.kind === 'occasion')
    .map((pot) => {
      const saved = snap.potSaved[pot.id] ?? 0;
      return {
        pot,
        saved,
        progress: pot.goal > 0 ? Math.min(1, saved / pot.goal) : 1,
        full: saved >= pot.goal,
        paused: pot.paused,
        monthly: snap.setAsideThisCycle[pot.id] ?? 0,
      };
    });
}

export interface BarDay {
  readonly day: LocalDate;
  readonly isToday: boolean;
  readonly weekend: boolean;
}

/** Today through payday, one bar each. */
export function barDays(today: LocalDate, payday: LocalDate): BarDay[] {
  const count = Math.max(1, diffDays(payday, today) + 1);
  return Array.from({ length: count }, (_, k) => {
    const day = addDays(today, k);
    return { day, isToday: k === 0, weekend: weekdayMondayFirst(day) >= 5 };
  });
}

/** The month 'YYYY-MM' that is `ahead` months after `from`; null for "No date" (0). */
export function potMonthAt(from: string, ahead: number): string | null {
  return ahead > 0 ? addMonthsTo(from, ahead) : null;
}
