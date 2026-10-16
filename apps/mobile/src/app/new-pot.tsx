import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import {
  aboutPerDay,
  cycleMonth,
  designAmount,
  suggestCategoryIcon,
  joinedShare,
  potSetAside,
} from '@6pm/domain';

import { useMoney } from '../data/money-provider';
import { usePlanActions } from '../data/plan-actions';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { useRunAction } from '../features/companion/use-run-action';
import { newPotLocked, potMonthAt } from '../features/plan/plan-view';
import { StepperRow } from '../features/plan/pot-rows';
import { PotSheet, type PotFields } from '../features/plan/pot-sheet';
import { usePotWarn } from '../features/plan/use-pot-warn';
import { useEntitlement } from '../features/purchases/purchases-provider';
import { useI18n } from '../i18n/i18n';
import { useMoneyFormat } from '../money/use-money-format';
import { haptics } from '../ui/haptics';

const SHARE_STEP = 5;

/**
 * New pot, or New goal (`?kind=goal`) for Future you: name it (or start from a template), pick
 * its icon and colour, type a goal and pick the month it is needed by (up to ten years out). The
 * monthly set-aside it will take, and what that does to a day, update live; one more than the
 * month has free says so and offers the soonest month that fits. A second occasion pot is Max.
 */
export default function NewPot() {
  const router = useRouter();
  // Ask opens this sheet filled in from "tạo hũ du lịch 10tr": a name, a goal, a month.
  const params = useLocalSearchParams<{
    kind?: string;
    name?: string;
    goal?: string;
    by?: string;
  }>();
  const kind = params.kind === 'goal' ? 'goal' : 'occasion';
  const askedName = typeof params.name === 'string' ? params.name.slice(0, 40) : '';
  const askedGoal = Number(params.goal);
  const askedBy =
    typeof params.by === 'string' && /^\d{4}-\d{2}$/.test(params.by) ? params.by : null;
  const askedIcon = askedName === '' ? null : suggestCategoryIcon(askedName);
  const { t } = useI18n();
  const money = useMoneyFormat();
  const currency = money.currency;
  const say = useCompanionToast();
  const run = useRunAction();
  const snap = useMoney();
  const actions = usePlanActions();
  const { max } = useEntitlement();
  const from = cycleMonth(snap.cycle);
  const [draft, setDraft] = useState<PotFields>({
    name: askedName,
    icon: askedIcon ?? (kind === 'goal' ? 'savings' : 'celebration'),
    hue: kind === 'goal' ? 150 : 85,
    // A goal Ask heard, already in the home currency; else the design's 10tr goal and 2tr pot,
    // worth as much in it.
    goal:
      Number.isFinite(askedGoal) && askedGoal > 0
        ? askedGoal
        : designAmount(kind === 'goal' ? 10_000_000 : 2_000_000, currency),
  });
  const [month, setMonth] = useState<string | null>(
    () => askedBy ?? potMonthAt(from, kind === 'goal' ? 0 : 3),
  );
  const others = snap.pots.filter((p) => p.kind === 'goal').length;
  const [percent, setPercent] = useState(
    others === 0 ? 100 : Math.round(100 / (others + 1) / SHARE_STEP) * SHARE_STEP,
  );
  // "Already saved": what it holds before 6pm. It lowers the monthly, never today's number.
  const [opening, setOpening] = useState(0);
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const finished = useRef(false);

  // The free pot is used and Max is not held (a link straight to this sheet): offer Max instead.
  const locked = kind === 'occasion' && newPotLocked(snap.pots, max);
  useEffect(() => {
    if (locked && !finished.current) {
      router.replace({ pathname: '/max', params: { from: 'pots' } });
    }
  }, [locked, router]);

  const change = (patch: Partial<PotFields>) => setDraft((d) => ({ ...d, ...patch }));
  const futureYou = snap.plan?.futureYou ?? 0;
  const share = percent / 100;
  const monthly = potSetAside({
    pot: { kind, goal: draft.goal, neededBy: month, share, paused: false },
    savedBefore: opening,
    futureYou,
    cycle: snap.cycle,
    currency,
  });
  const perDay = aboutPerDay(
    monthly,
    snap.cycle.daysLeft,
    joinedShare(snap.cycle, snap.plan?.startedOn ?? null),
    currency,
  );

  const warn = usePotWarn({
    potId: null,
    goal: draft.goal,
    saved: opening,
    monthly: kind === 'goal' ? 0 : monthly,
    from,
    onMonth: setMonth,
  });
  const summary =
    kind === 'goal'
      ? futureYou > 0
        ? {
            title: t('plan.goal.sumMonthly', { amount: money.short(monthly) }),
            sub: t('plan.goal.sumSub'),
          }
        : { title: t('plan.goal.sumNone'), sub: t('plan.goal.sumNoneSub') }
      : month
        ? {
            title: t('plan.pot.sumMonthly', { amount: money.short(monthly) }),
            sub: t('plan.pot.sumMonthlySub', { amount: money.short(perDay) }),
            warn,
          }
        : { title: t('plan.pot.sumNone'), sub: t('plan.pot.sumNoneSub') };

  const start = async () => {
    if (busy.current || draft.name.trim().length === 0) return;
    busy.current = true;
    setWorking(true);
    const made = await run(() =>
      actions.createPot({
        kind,
        name: draft.name,
        icon: draft.icon,
        hue: draft.hue,
        goal: draft.goal,
        neededBy: month,
        opening,
        ...(kind === 'goal' ? { share } : {}),
      }),
    );
    if (!made) {
      busy.current = false;
      setWorking(false);
      return;
    }
    finished.current = true;
    haptics.success();
    router.back();
    say('potMade');
  };

  return (
    <PotSheet
      title={kind === 'goal' ? t('plan.future.newGoal') : t('plan.occasions.newPot')}
      placeholder={kind === 'goal' ? t('plan.goal.placeholder') : t('plan.pot.placeholder')}
      fields={draft}
      onChange={change}
      onTemplate={
        kind === 'occasion'
          ? ({ ahead, ...fields }) => {
              setDraft(fields);
              setMonth(potMonthAt(from, ahead));
            }
          : undefined
      }
      month={month}
      onMonth={setMonth}
      from={from}
      opening={{ amount: opening, onChange: setOpening }}
      rows={
        kind === 'goal' && others > 0 ? (
          <StepperRow
            label={t('plan.pot.share')}
            value={`${percent}%`}
            lessLabel={t('plan.pot.less')}
            moreLabel={t('plan.pot.more')}
            dimLess={percent <= SHARE_STEP}
            dimMore={percent >= 100 - SHARE_STEP}
            width={56}
            onStep={(by) =>
              setPercent((p) =>
                Math.min(100 - SHARE_STEP, Math.max(SHARE_STEP, p + by * SHARE_STEP)),
              )
            }
          />
        ) : null
      }
      summary={summary}
      cta={{
        label: kind === 'goal' ? t('plan.goal.start') : t('plan.pot.start'),
        enabled: !working && !locked,
        onPress: () => void start(),
      }}
    />
  );
}
