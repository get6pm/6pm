import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import {
  aboutPerDay,
  cycleMonth,
  formatShort,
  goalMonthly,
  joinedShare,
  potMonthlyNeed,
  potMonthsLeft,
} from '@6pm/domain';

import { useMoney } from '../data/money-provider';
import { usePlanActions } from '../data/plan-actions';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { useRunAction } from '../features/companion/use-run-action';
import type { PotDraft } from '../features/plan/new-pot-picker';
import { usePlanFormat } from '../features/plan/plan-format';
import {
  newPotLocked,
  potMonthAt,
  stepPotMonth,
  POT_MONTHS_AHEAD,
} from '../features/plan/plan-view';
import { StepperRow } from '../features/plan/pot-rows';
import { PotSheet } from '../features/plan/pot-sheet';
import { useEntitlement } from '../features/purchases/purchases-provider';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';

const LAST_AHEAD = POT_MONTHS_AHEAD[POT_MONTHS_AHEAD.length - 1] ?? 8;
const SHARE_STEP = 5;

/**
 * New pot, or New goal (`?kind=goal`) for Future you: name it (or start from a template), pick
 * its icon and colour, set a goal and the month it is needed by. The monthly set-aside it will
 * take, and what that does to a day, update live. A second occasion pot is part of Max.
 */
export default function NewPot() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = params.kind === 'goal' ? 'goal' : 'occasion';
  const { t, language } = useI18n();
  const say = useCompanionToast();
  const run = useRunAction();
  const snap = useMoney();
  const actions = usePlanActions();
  const format = usePlanFormat(snap.today);
  const { max } = useEntitlement();
  const [draft, setDraft] = useState<PotDraft>({
    name: '',
    icon: kind === 'goal' ? 'savings' : 'celebration',
    hue: kind === 'goal' ? 150 : 85,
    goal: kind === 'goal' ? 10_000_000 : 2_000_000,
    ahead: kind === 'goal' ? 0 : 3,
  });
  const others = snap.pots.filter((p) => p.kind === 'goal').length;
  const [percent, setPercent] = useState(
    others === 0 ? 100 : Math.round(100 / (others + 1) / SHARE_STEP) * SHARE_STEP,
  );
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

  const change = (patch: Partial<PotDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const month = potMonthAt(cycleMonth(snap.cycle), draft.ahead);
  const futureYou = snap.plan?.futureYou ?? 0;
  const share = percent / 100;
  const monthly =
    kind === 'goal'
      ? Math.min(draft.goal, goalMonthly(futureYou, share))
      : potMonthlyNeed(draft.goal, 0, potMonthsLeft(snap.cycle, month));
  const perDay = aboutPerDay(
    monthly,
    snap.cycle.daysLeft,
    joinedShare(snap.cycle, snap.plan?.startedOn ?? null),
  );

  const summary =
    kind === 'goal'
      ? futureYou > 0
        ? {
            title: t('plan.goal.sumMonthly', { amount: formatShort(monthly, language) }),
            sub: t('plan.goal.sumSub'),
          }
        : { title: t('plan.goal.sumNone'), sub: t('plan.goal.sumNoneSub') }
      : month
        ? {
            title: t('plan.pot.sumMonthly', { amount: formatShort(monthly, language) }),
            sub: t('plan.pot.sumMonthlySub', { amount: formatShort(perDay, language) }),
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
      onTemplate={kind === 'occasion' ? setDraft : undefined}
      month={month}
      monthLabel={month ? format.monthLong(month) : t('plan.pot.noDate')}
      canEarlier={draft.ahead !== 0}
      canLater={draft.ahead < LAST_AHEAD}
      onStepMonth={(by) => change({ ahead: stepPotMonth(draft.ahead, by) })}
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
