import { potFit, potRoom, soonestNeededBy, type Vnd, billsThisCycle } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { usePlanFormat } from './plan-format';
import type { PotCost } from './pot-sheet-cost';
import { occasionsMonthly } from './plan-view';

export interface PotCostView {
  readonly cost: PotCost;
  /** The first month that fits the plan (null: none within ten years); undefined: not measured. */
  readonly fitsFrom: string | null | undefined;
  /** Over the keypad: what the typed goal costs a month to make its date. */
  readonly goalHint: string | undefined;
}

/**
 * What a saved pot costs, for its card: the monthly set-aside, a day's share and how much of the
 * month's free money (income less bills, Future you and the other pots) it takes. Too much, and
 * it names the soonest month that fits and offers to use it. A goal is fed by Future you, so it
 * takes nothing from the free money and is not measured against it.
 */
export function usePotCost(input: {
  readonly potId: string;
  readonly goalKind: boolean;
  readonly goal: Vnd;
  /** What the pot held when this cycle began. */
  readonly saved: Vnd;
  readonly monthly: Vnd;
  readonly perDay: Vnd;
  readonly month: string | null;
  readonly paused: boolean;
  readonly from: string;
  readonly onMonth: (month: string) => void;
}): PotCostView {
  const snap = useMoney();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const format = usePlanFormat(snap.today);
  const futureYou = snap.plan?.futureYou ?? 0;
  const income = snap.plan?.income ?? 0;
  const own = snap.setAsideThisCycle[input.potId] ?? 0;
  const room =
    input.goalKind || income <= 0
      ? null
      : potRoom({
          income,
          bills: billsThisCycle(snap.bills, snap.cycle),
          futureYou,
          otherOccasions: Math.max(0, occasionsMonthly(snap) - own),
        });
  const fitsFrom =
    room === null
      ? undefined
      : soonestNeededBy({
          goal: input.goal,
          saved: input.saved,
          room,
          from: input.from,
          currency: money.currency,
        });
  const monthly = money.short(input.monthly);
  const goalHint =
    !input.goalKind && !input.paused && input.month !== null && input.monthly > 0
      ? t('plan.pot.goalHint', { amount: monthly, month: format.monthShort(input.month) })
      : undefined;

  const cost = ((): PotCost => {
    if (input.paused) return { title: t('plan.pot.sumPaused'), note: t('plan.pot.sumPausedSub') };
    if (input.goalKind) {
      return futureYou > 0
        ? { title: t('plan.pot.costMonthly', { amount: monthly }), note: t('plan.goal.sumSub') }
        : { title: t('plan.goal.sumNone'), note: t('plan.goal.sumNoneSub') };
    }
    if (input.month === null) {
      return { title: t('plan.pot.sumNone'), note: t('plan.pot.sumNoneSub') };
    }
    const title = t('plan.pot.costMonthly', { amount: monthly });
    const perDay = t('plan.pot.costPerDay', { amount: money.short(input.perDay) });
    if (room === null) return { title, aside: perDay };
    const fit = potFit(input.monthly, room);
    if (fit.fits) {
      return {
        title,
        aside: perDay,
        fit: {
          share: fit.share,
          text: t('plan.pot.costFits', { left: money.short(fit.left), room: money.short(room) }),
        },
      };
    }
    const soonest = fitsFrom ?? null;
    return {
      title,
      aside: t('plan.pot.costRoom', { room: money.short(room) }),
      warn:
        soonest === null
          ? { text: t('plan.pot.costNever') }
          : {
              text: t('plan.pot.costTooFast', { month: format.monthLong(soonest) }),
              action: {
                label: t('plan.pot.useSoonest', { month: format.monthShort(soonest) }),
                onPress: () => input.onMonth(soonest),
              },
            },
    };
  })();

  return { cost, fitsFrom, goalHint };
}
