import type { SpendSource, SpendStatus } from '../spend/spend';

/** Two sightings of one payment arrive within this long of each other. */
export const DUPLICATE_WINDOW_MS = 3 * 60_000;

/**
 * A QR scan still waiting to be paid is matched by its bank's receipt (email, shared receipt,
 * Apple Pay) arriving up to this long after the tap: the user may finish paying in the bank app a
 * while later. Never before the tap.
 */
export const QR_RECEIPT_WINDOW_MS = 20 * 60_000;

/**
 * Sources 6pm hears about a payment from. Two of these seeing one payment are two witnesses of it;
 * something the user typed (Quick add, voice, cash) is a spend they chose to record, never a
 * second sighting of a capture.
 */
const OBSERVED: ReadonlySet<SpendSource> = new Set(['qr', 'shared', 'email', 'applePay']);

/** Sources that hear from the bank or the wallet once money has actually moved. */
const PAID: ReadonlySet<SpendSource> = new Set(['shared', 'email', 'applePay']);

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
  /** How the capture arrives; a scan arrives `pending`. Left out, it is not a waiting scan. */
  readonly status?: SpendStatus;
}

interface Sighting {
  readonly source: SpendSource;
  readonly status?: SpendStatus | undefined;
  readonly at: number;
}

/** A scan still waiting and the bank's word that it was paid, from the tap to 20 minutes after. */
function paysWaitingScan(scan: Sighting, receipt: Sighting): boolean {
  if (scan.source !== 'qr' || scan.status !== 'pending' || !PAID.has(receipt.source)) return false;
  const after = receipt.at - scan.at;
  return after >= 0 && after <= QR_RECEIPT_WINDOW_MS;
}

/** Whether two sightings from different capture sources are close enough to be one payment. */
function closeEnough(a: Sighting, b: Sighting): boolean {
  return (
    Math.abs(a.at - b.at) <= DUPLICATE_WINDOW_MS || paysWaitingScan(a, b) || paysWaitingScan(b, a)
  );
}

/**
 * The spend a new capture is the same payment as: same amount, a different capture source (QR,
 * shared receipt, email, Apple Pay), within three minutes (the nearest in time wins). A QR scan
 * still pending is also matched by a bank receipt, shared receipt or Apple Pay from its tap up to
 * twenty minutes after it, never before. Skipped and
 * deleted spends never absorb a capture. A spend the user typed (Quick add, voice, cash) is never
 * merged with anything: each was entered on purpose, and no other source can have seen cash.
 */
export function findDuplicate(
  incoming: NewSighting,
  existing: readonly SightedSpend[],
): SightedSpend | null {
  const at = Date.parse(incoming.at);
  if (Number.isNaN(at) || incoming.amount <= 0) return null;
  const arriving: Sighting = { source: incoming.source, status: incoming.status, at };
  let best: SightedSpend | null = null;
  let bestGap = Infinity;
  for (const spend of existing) {
    if (spend.status === 'skipped' || spend.status === 'deleted') continue;
    if (spend.amount !== incoming.amount || spend.source === incoming.source) continue;
    if (!OBSERVED.has(spend.source) || !OBSERVED.has(incoming.source)) continue;
    const seen: Sighting = { source: spend.source, status: spend.status, at: Date.parse(spend.at) };
    const gap = Math.abs(seen.at - at);
    if (closeEnough(seen, arriving) && gap < bestGap) {
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
