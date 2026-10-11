import type { SpendSource, SpendStatus } from '../spend/spend';

/** Two sightings of one payment arrive within this long of each other. */
export const DUPLICATE_WINDOW_MS = 3 * 60_000;

/**
 * Sources 6pm hears about a payment from. Two of these seeing one payment are two witnesses of it;
 * something the user typed (Quick add, voice, cash) is a spend they chose to record, never a
 * second sighting of a capture.
 */
const OBSERVED: ReadonlySet<SpendSource> = new Set(['qr', 'shared', 'email', 'applePay']);

export interface SightedSpend {
  readonly id: string;
  readonly amount: number;
  readonly source: SpendSource;
  readonly status: SpendStatus;
  /** When it happened, ISO 8601. */
  readonly at: string;
}

export interface NewSighting {
  readonly amount: number;
  readonly source: SpendSource;
  readonly at: string;
}

/**
 * The spend a new capture is the same payment as: same amount, a different capture source (QR,
 * shared receipt, email, Apple Pay), within three minutes (the nearest in time wins). Skipped and
 * deleted spends never absorb a capture. A spend the user typed (Quick add, voice, cash) is never
 * merged with anything: each was entered on purpose, and no other source can have seen cash.
 */
export function findDuplicate(
  incoming: NewSighting,
  existing: readonly SightedSpend[],
): SightedSpend | null {
  const at = Date.parse(incoming.at);
  if (Number.isNaN(at) || incoming.amount <= 0) return null;
  let best: SightedSpend | null = null;
  let bestGap = Infinity;
  for (const spend of existing) {
    if (spend.status === 'skipped' || spend.status === 'deleted') continue;
    if (spend.amount !== incoming.amount || spend.source === incoming.source) continue;
    if (!OBSERVED.has(spend.source) || !OBSERVED.has(incoming.source)) continue;
    const gap = Math.abs(Date.parse(spend.at) - at);
    if (gap <= DUPLICATE_WINDOW_MS && gap < bestGap) {
      best = spend;
      bestGap = gap;
    }
  }
  return best;
}

/** What a merged spend becomes: confirmed if either sighting was, otherwise as it was. */
export function mergedStatus(existing: SpendStatus, incoming: SpendStatus): SpendStatus {
  return existing === 'kept' || incoming === 'kept' ? 'kept' : existing;
}
