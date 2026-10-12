import type { SpendRow } from '@6pm/domain';

import type { RunningActivity } from '../../../modules/surfaces';
import type { MoneySnapshot } from '../../data/money-store';

export interface ActivityPlanInput {
  /** What iOS has running now (`listActivities`). Travel activities are left alone. */
  readonly running: readonly RunningActivity[];
  /** The money day's QR payments still waiting (`pendingPayments`). */
  readonly pending: readonly SpendRow[];
  /** The money day is closed: nothing waits on the Lock Screen after the close. */
  readonly closed: boolean;
  /** iOS only starts an activity for an app in the foreground. */
  readonly foreground: boolean;
  /** Live Activities are allowed for 6pm in Settings. */
  readonly enabled: boolean;
  /** Scan is still asking "Did it go through?": no activity until it has its answer. */
  readonly held: boolean;
  /** The content state for a waiting payment, as JSON. */
  readonly stateOf: (spend: SpendRow) => string;
}

export interface ActivityPlan {
  readonly start: {
    readonly kind: 'pendingPay';
    readonly key: string;
    readonly stateJson: string;
  } | null;
  readonly update: readonly { readonly id: string; readonly stateJson: string }[];
  readonly end: readonly { readonly id: string; readonly finalStateJson: null }[];
}

/** The QR payments of the money day that are still waiting, newest first. */
export function pendingPayments(money: MoneySnapshot): SpendRow[] {
  return money.cycleSpends
    .filter((s) => s.day === money.today && s.source === 'qr' && s.status === 'pending')
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

function newest(spends: readonly SpendRow[]): SpendRow | null {
  let best: SpendRow | null = null;
  for (const spend of spends) if (best === null || spend.at > best.at) best = spend;
  return best;
}

/**
 * One waiting-payment activity at most, for the newest waiting QR payment of the money day. It
 * ends when that payment is kept, skipped, deleted or cancelled, when a newer one takes its place,
 * or when the day is closed; it is updated when its words change (the language, an edited amount).
 * A start waits for the foreground and for Scan's own question to be answered.
 */
export function liveActivityPlan(input: ActivityPlanInput): ActivityPlan {
  const target = input.closed ? null : newest(input.pending);
  const update: { id: string; stateJson: string }[] = [];
  const end: { id: string; finalStateJson: null }[] = [];
  let kept = false;
  for (const activity of input.running) {
    if (activity.kind !== 'pendingPay') continue;
    if (target !== null && !kept && activity.key === target.id) {
      kept = true;
      const stateJson = input.stateOf(target);
      if (stateJson !== activity.stateJson) update.push({ id: activity.id, stateJson });
    } else {
      end.push({ id: activity.id, finalStateJson: null });
    }
  }
  const canStart = input.foreground && input.enabled && !input.held;
  const start =
    target !== null && !kept && canStart
      ? { kind: 'pendingPay' as const, key: target.id, stateJson: input.stateOf(target) }
      : null;
  return { start, update, end };
}

/** Nothing to do. */
export function isIdle(plan: ActivityPlan): boolean {
  return plan.start === null && plan.update.length === 0 && plan.end.length === 0;
}
