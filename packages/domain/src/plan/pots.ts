import type { PotRow } from '../contracts/local-rows';
import type { Vnd } from '../money/format';
import type { LocalDate } from '../time/local-date';
import { cycleMonth, payCycleOn, type PayCycle, type Payday } from './pay-cycle';
import { goalMonthly, monthsBetween, potMonthlyNeed } from './plan-river';

/**
 * Pots only count: 6pm never moves money. Each pay cycle writes one `setAside` move per pot, the
 * pot's share of that month's money, so the jar fills as the months go by.
 */
export type PotMoveKind = 'setAside' | 'topUp' | 'spent';

export interface PotMove {
  readonly potId: string;
  readonly kind: PotMoveKind;
  /** The payday of the cycle the move belongs to (`PayCycle.start`). */
  readonly cycle: LocalDate;
  readonly amount: Vnd;
}

/** What a pot's set-aside depends on. */
export type PotTerms = Pick<PotRow, 'kind' | 'goal' | 'neededBy' | 'share' | 'paused'>;

/** The most cycles one catch-up writes: a damaged clock must not fill the database. */
const MAX_CYCLES = 240;

/** Months from the cycle to a pot's month, at least one; null for a pot with no date. */
export function potMonthsLeft(cycle: PayCycle, neededBy: string | null): number | null {
  return neededBy === null ? null : monthsBetween(cycleMonth(cycle), neededBy);
}

/**
 * What a pot sets aside in one cycle, given what it held when the cycle began.
 * - An occasion spreads what is left over the months to its date (ceil to 50.000₫, never more than
 *   is left), and stops once that month has gone by. No date, nothing set aside.
 * - A Future you goal takes its share of the monthly Future you, until it is full.
 * - A paused or full pot sets nothing aside.
 */
export function potSetAside(input: {
  readonly pot: PotTerms;
  readonly savedBefore: Vnd;
  readonly futureYou: Vnd;
  readonly cycle: PayCycle;
}): Vnd {
  const { pot, savedBefore, futureYou, cycle } = input;
  const left = Math.max(0, pot.goal - savedBefore);
  if (pot.paused || left === 0) return 0;
  if (pot.kind === 'goal') return Math.min(left, goalMonthly(futureYou, pot.share ?? 0));
  if (pot.neededBy === null || cycleMonth(cycle) > pot.neededBy) return 0;
  return potMonthlyNeed(pot.goal, savedBefore, potMonthsLeft(cycle, pot.neededBy));
}

/** What a pot held when a cycle began: every move filed in an earlier cycle. */
export function savedBefore(moves: readonly PotMove[], potId: string, cycleStart: LocalDate): Vnd {
  return moves.reduce(
    (sum, m) => (m.potId === potId && m.cycle < cycleStart ? sum + m.amount : sum),
    0,
  );
}

export interface SetAsideRecord {
  readonly potId: string;
  readonly cycle: LocalDate;
  readonly amount: Vnd;
}

/**
 * The set-asides still to write, in order: for each pot, one per pay cycle after its last one
 * through the current cycle (from its first cycle when it has none). A cycle that is already
 * recorded is never written twice, a launch that skipped cycles catches up on all of them, and a
 * pot that sets nothing aside still gets a zero so a later edit cannot reach back into the past.
 */
export function dueSetAsides(input: {
  readonly pots: readonly (PotTerms & Pick<PotRow, 'id' | 'createdAt'>)[];
  readonly moves: readonly PotMove[];
  /** Future you's monthly amount, shared between the goals. */
  readonly futureYou: Vnd;
  readonly payday: Payday;
  readonly today: LocalDate;
  /** The phone's day an instant falls on; passed in so the domain holds no time zone. */
  readonly dayOf: (instant: string) => LocalDate;
}): SetAsideRecord[] {
  const { moves, payday, today, futureYou } = input;
  const current = payCycleOn(today, payday);
  const out: SetAsideRecord[] = [];
  for (const pot of input.pots) {
    const recorded = moves
      .filter((m) => m.potId === pot.id && m.kind === 'setAside')
      .reduce<LocalDate | null>(
        (last, m) => (last === null || m.cycle > last ? m.cycle : last),
        null,
      );
    let cycle: PayCycle;
    if (recorded === null) {
      const made = input.dayOf(pot.createdAt);
      cycle = payCycleOn(made > today ? today : made, payday);
    } else {
      if (recorded >= current.start) continue;
      cycle = payCycleOn(payCycleOn(recorded, payday).payday, payday);
    }
    let added = 0;
    for (let n = 0; n < MAX_CYCLES && cycle.start <= current.start; n++) {
      const amount = potSetAside({
        pot,
        savedBefore: savedBefore(moves, pot.id, cycle.start) + added,
        futureYou,
        cycle,
      });
      out.push({ potId: pot.id, cycle: cycle.start, amount });
      added += amount;
      const next = payCycleOn(cycle.payday, payday);
      if (next.start <= cycle.start) break;
      cycle = next;
    }
  }
  return out;
}

export interface PotTotals {
  /** Held per pot, from all its moves. */
  readonly saved: Readonly<Record<string, Vnd>>;
  /** Set aside per pot in the cycle. */
  readonly setAside: Readonly<Record<string, Vnd>>;
  /** The +100k top-ups of the cycle, every pot together. */
  readonly topUps: Vnd;
}

/** Adds the moves of the pots that still exist. A deleted pot gives its money back to free. */
export function potTotals(
  moves: readonly PotMove[],
  potIds: ReadonlySet<string>,
  cycleStart: LocalDate,
): PotTotals {
  const saved: Record<string, Vnd> = {};
  const setAside: Record<string, Vnd> = {};
  let topUps = 0;
  for (const move of moves) {
    if (!potIds.has(move.potId)) continue;
    saved[move.potId] = (saved[move.potId] ?? 0) + move.amount;
    if (move.cycle !== cycleStart) continue;
    if (move.kind === 'topUp') topUps += move.amount;
    if (move.kind === 'setAside') setAside[move.potId] = (setAside[move.potId] ?? 0) + move.amount;
  }
  return { saved, setAside, topUps };
}

/** Occasions in the daily number: what the occasion pots set aside this cycle, added up. */
export function occasionsOf(
  pots: readonly Pick<PotRow, 'id' | 'kind'>[],
  setAside: Readonly<Record<string, Vnd>>,
): Vnd {
  return pots.reduce((sum, p) => (p.kind === 'occasion' ? sum + (setAside[p.id] ?? 0) : sum), 0);
}

/**
 * Splits Future you between its goals so the shares add up to one. `pinned` keeps the share it was
 * given (the goal the user just set) and the others fill the rest in their old proportions, or
 * evenly when they had none. Without `pinned` every share is scaled to fit. Shares are whole
 * percents; rounding leaves the largest of the others with the difference.
 */
export function rebalanceShares(
  shares: Readonly<Record<string, number>>,
  pinned?: string,
): Record<string, number> {
  const ids = Object.keys(shares);
  const only = ids[0];
  if (only === undefined) return {};
  if (ids.length === 1) return { [only]: 1 };
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const pin = pinned !== undefined && pinned in shares ? pinned : null;
  const keep = pin === null ? 0 : clamp(shares[pin] ?? 0);
  const others = ids.filter((id) => id !== pin);
  const total = others.reduce((sum, id) => sum + clamp(shares[id] ?? 0), 0);
  const out: Record<string, number> = {};
  for (const id of others) {
    const part = total > 0 ? clamp(shares[id] ?? 0) / total : 1 / others.length;
    out[id] = Math.round(part * (1 - keep) * 100) / 100;
  }
  const absorbs = others.sort((a, b) => (out[b] ?? 0) - (out[a] ?? 0))[0];
  if (pin !== null) out[pin] = Math.round(keep * 100) / 100;
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  const last = absorbs ?? pin;
  if (last !== null) out[last] = Math.round(((out[last] ?? 0) + (1 - sum)) * 100) / 100;
  return out;
}

/** The quick top-up's steps, smallest first: 100k for an everyday pot up to 100tr for a home. */
const TOP_UP_STEPS: readonly Vnd[] = [
  100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000,
];

/**
 * A jar's quick top-up, scaled to its goal: the largest round step that is at most a twentieth of
 * it, never below 100k. A 2tr birthday adds 100k a tap, a 20tr trip 1tr, an 800tr car 10tr and a
 * 2 tỷ home 100tr.
 */
export function potTopUpStep(goal: Vnd): Vnd {
  const most = goal / 20;
  return TOP_UP_STEPS.reduce((best, step) => (step <= most ? step : best), TOP_UP_STEPS[0] ?? 0);
}
