import { potRoom, soonestNeededBy, type Vnd, billsThisCycle } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { usePlanFormat } from './plan-format';
import type { PotSummaryContent } from './pot-sheet-parts';
import { occasionsMonthly } from './plan-view';

/**
 * The line under an occasion pot's summary when its monthly set-aside is more than the month has
 * free (income less bills, Future you and the other pots): it would take the daily number below
 * zero. It names the soonest month that fits and offers to use it. Nothing without a plan yet.
 */
export function usePotWarn(input: {
  /** The pot being edited, whose own set-aside is not "another pot"; null for a new one. */
  readonly potId: string | null;
  readonly goal: Vnd;
  readonly saved: Vnd;
  readonly monthly: Vnd;
  readonly from: string;
  readonly onMonth: (month: string) => void;
}): PotSummaryContent['warn'] {
  const snap = useMoney();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const format = usePlanFormat(snap.today);
  const income = snap.plan?.income ?? 0;
  if (income <= 0 || input.monthly <= 0) return undefined;
  const own = input.potId === null ? 0 : (snap.setAsideThisCycle[input.potId] ?? 0);
  const room = potRoom({
    income,
    bills: billsThisCycle(snap.bills, snap.cycle),
    futureYou: snap.plan?.futureYou ?? 0,
    otherOccasions: Math.max(0, occasionsMonthly(snap) - own),
  });
  if (input.monthly <= room) return undefined;
  const roomText = money.short(room);
  const soonest = soonestNeededBy({
    goal: input.goal,
    saved: input.saved,
    room,
    from: input.from,
    currency: money.currency,
  });
  if (soonest === null) return { text: t('plan.pot.tooMuchNever', { room: roomText }) };
  const label = format.monthLong(soonest);
  return {
    text: t('plan.pot.tooMuch', { room: roomText, month: label }),
    action: {
      label: t('plan.pot.useSoonest', { month: label }),
      onPress: () => input.onMonth(soonest),
    },
  };
}
