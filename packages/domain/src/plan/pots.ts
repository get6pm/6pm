import { designAmount, VND, type Currency } from '../money/currency';
import type { PotRow } from '../contracts/local-rows';
import type { Vnd } from '../money/format';
import type { LocalDate } from '../time/local-date';
import { cycleMonth, payCycleOn, type PayCycle, type Payday } from './pay-cycle';
import { goalMonthly, monthsBetween, potMonthlyNeed } from './plan-river';

/**
 * Pots only count: 6pm never moves money. Each pay cycle writes one `setAside` move per pot, the
 * pot's share of that month's money, so the jar fills as the months go by. An `opening` move is
 * what the pot already held before 6pm ("Already saved"): one per pot at most, it counts in what
 * the pot holds and never in a cycle's top-ups, so it never lowers the daily number.
 */
export type PotMoveKind = 'setAside' | 'topUp' | 'spent' | 'opening';

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
  /** The home currency; đồng when not given. */
  readonly currency?: Currency;
}): Vnd {
  const { pot, savedBefore, futureYou, cycle, currency = VND } = input;
  const left = Math.max(0, pot.goal - savedBefore);
  if (pot.paused || left === 0) return 0;
  if (pot.kind === 'goal') return Math.min(left, goalMonthly(futureYou, pot.share ?? 0));
  if (pot.neededBy === null || cycleMonth(cycle) > pot.neededBy) return 0;
  return potMonthlyNeed(pot.goal, savedBefore, potMonthsLeft(cycle, pot.neededBy), currency);
}

/**
 * What a pot held when a cycle began: every move filed in an earlier cycle, and what it already
 * held before 6pm, whenever that was typed, so the cycle's set-aside already knows about it.
 */
export function savedBefore(moves: readonly PotMove[], potId: string, cycleStart: LocalDate): Vnd {
  return moves.reduce(
    (sum, m) =>
      m.potId === potId && (m.kind === 'opening' || m.cycle < cycleStart) ? sum + m.amount : sum,
    0,
  );
}

/** What a pot already held before 6pm: its opening move, 0 when it has none. */
export function openingOf(moves: readonly PotMove[], potId: string): Vnd {
  return moves.reduce(
    (sum, m) => (m.potId === potId && m.kind === 'opening' ? sum + m.amount : sum),
    0,
  );
}

/** An amount the pot holds, as it would be with `opening` typed in place of its opening move. */
export function withOpening(
  held: Vnd,
  moves: readonly PotMove[],
  potId: string,
  opening: Vnd,
): Vnd {
  return held - openingOf(moves, potId) + Math.max(0, Math.round(opening));
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
  /**
   * Cycles that start before this day set nothing aside for Future you, as when the person chose
   * to start it at payday (`futureYouStartsOn`). Null or left out: every cycle does.
   */
  readonly futureYouFrom?: LocalDate | null;
  readonly payday: Payday;
  readonly today: LocalDate;
  /** The phone's day an instant falls on; passed in so the domain holds no time zone. */
  readonly dayOf: (instant: string) => LocalDate;
  /** The home currency; đồng when not given. */
  readonly currency?: Currency;
}): SetAsideRecord[] {
  const { moves, payday, today, futureYou, futureYouFrom, currency = VND } = input;
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
        futureYou: futureYouFrom != null && cycle.start < futureYouFrom ? 0 : futureYou,
        cycle,
        currency,
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
 * percents, each between none and all: the others' percents are rounded down and the points still
 * missing go to those that lost the most in the rounding (the largest remainders).
 */
export function rebalanceShares(
  shares: Readonly<Record<string, number>>,
  pinned?: string,
): Record<string, number> {
  const ids = Object.keys(shares);
  const only = ids[0];
  if (only === undefined) return {};
  if (ids.length === 1) return { [only]: 1 };
  const clamp = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
  const pin = pinned !== undefined && pinned in shares ? pinned : null;
  const keep = pin === null ? 0 : Math.round(clamp(shares[pin] ?? 0) * 100);
  const others = ids.filter((id) => id !== pin);
  const total = others.reduce((sum, id) => sum + clamp(shares[id] ?? 0), 0);
  const exact = others.map((id) => {
    const part = total > 0 ? clamp(shares[id] ?? 0) / total : 1 / others.length;
    return { id, points: part * (100 - keep) };
  });
  const points: Record<string, number> = {};
  for (const { id, points: p } of exact) points[id] = Math.floor(p);
  let missing = 100 - keep - exact.reduce((sum, e) => sum + (points[e.id] ?? 0), 0);
  const byRemainder = [...exact].sort(
    (a, b) => b.points - Math.floor(b.points) - (a.points - Math.floor(a.points)),
  );
  for (const { id } of byRemainder) {
    if (missing <= 0) break;
    points[id] = (points[id] ?? 0) + 1;
    missing -= 1;
  }
  const out: Record<string, number> = {};
  for (const id of ids) out[id] = (id === pin ? keep : (points[id] ?? 0)) / 100;
  return out;
}

/** The quick top-up's steps, smallest first: 100k for an everyday pot up to 100tr for a home. */
const TOP_UP_STEPS: readonly Vnd[] = [
  100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000,
];

/**
 * A jar's quick top-up, scaled to its goal: the largest round step that is at most a twentieth of
 * it, never below 100k. A 2tr birthday adds 100k a tap, a 20tr trip 1tr, an 800tr car 10tr and a
 * 2 tỷ home 100tr. Outside đồng the ladder is 1 and 5 times a power of ten.
 */
export function potTopUpStep(goal: Vnd, currency: Currency = VND): Vnd {
  const most = goal / 20;
  const steps = currency.code === 'VND' ? TOP_UP_STEPS : topUpStepsIn(currency);
  return steps.reduce((best, step) => (step <= most ? step : best), steps[0] ?? 0);
}

/**
 * What one tap of a jar's quick top-up adds: the step, or only what is left when that is less, and
 * nothing once the jar is full.
 */
export function potTopUp(goal: Vnd, saved: Vnd, step: Vnd): Vnd {
  return Math.max(0, Math.min(step, goal - saved));
}

/**
 * The same ladder outside đồng: 1 and 5 times a power of ten, from the largest such amount no
 * bigger than the design's 100k worth in the currency ($1, then $5, $10, $50 …), seven rungs.
 */
function topUpStepsIn(currency: Currency): Vnd[] {
  const first = designAmount(100_000, currency);
  const power = 10 ** Math.floor(Math.log10(first));
  let step = first >= 5 * power ? 5 * power : power;
  const steps: Vnd[] = [];
  for (let i = 0; i < 7; i++) {
    steps.push(step);
    step = String(step).startsWith('1') ? step * 5 : step * 2;
  }
  return steps;
}
