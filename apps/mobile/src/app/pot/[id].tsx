import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import {
  aboutPerDay,
  cycleMonth,
  formatShort,
  joinedShare,
  potSetAside,
  savedBefore,
} from '@6pm/domain';

import { useMoney, useMoneyStore } from '../../data/money-provider';
import { usePlanActions, type PotPatch } from '../../data/plan-actions';
import { readPotMoves } from '../../data/pot-moves';
import { useRunAction } from '../../features/companion/use-run-action';
import { usePlanFormat } from '../../features/plan/plan-format';
import { canStepNeededBy, stepNeededBy } from '../../features/plan/plan-view';
import { potRow, StepperRow } from '../../features/plan/pot-rows';
import { PotSheet, type PotFields } from '../../features/plan/pot-sheet';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { Switch } from '../../ui/primitives/switch';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useOfferUndo } from '../../ui/undo/undo-host';

const SHARE_STEP = 5;

/**
 * A saved pot or goal: change its name, look, goal and month, give a goal a different share of
 * Future you, pause it (it sets nothing aside until it is turned back on) or delete it.
 */
export default function EditPot() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useI18n();
  const { palette } = useTheme();
  const run = useRunAction();
  const offerUndo = useOfferUndo();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = usePlanActions();
  const format = usePlanFormat(snap.today);
  const pot = snap.pots.find((p) => p.id === id);
  const [fields, setFields] = useState<PotFields | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [percent, setPercent] = useState(100);
  const [held, setHeld] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const left = useRef(false);

  // The sheet edits a copy; it starts from the pot as saved, once.
  useEffect(() => {
    if (!pot || fields !== null) return;
    setFields({
      name: pot.name,
      icon: isSymbolName(pot.icon) ? pot.icon : 'celebration',
      hue: pot.hue,
      goal: pot.goal,
    });
    setMonth(pot.neededBy);
    setPaused(pot.paused);
    setPercent(Math.round((pot.share ?? 1) * 100));
  }, [pot, fields]);

  // What the pot held when this cycle began, so the sheet shows the set-aside it will really take.
  const startOfCycle = snap.cycle.start;
  useEffect(() => {
    let live = true;
    readPotMoves(store.db).then(
      (moves) => {
        if (live) setHeld(savedBefore(moves, id ?? '', startOfCycle));
      },
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [store, id, startOfCycle]);

  // The pot is gone (deleted here, or restored away): nothing left to edit.
  useEffect(() => {
    if (!pot && !left.current) {
      left.current = true;
      router.back();
    }
  }, [pot, router]);

  if (!pot || !fields) return null;
  const goalKind = pot.kind === 'goal';
  const goals = snap.pots.filter((p) => p.kind === 'goal').length;
  const futureYou = snap.plan?.futureYou ?? 0;
  const from = cycleMonth(snap.cycle);
  const share = goalKind ? (goals > 1 ? percent / 100 : 1) : null;
  const monthly = potSetAside({
    pot: { kind: pot.kind, goal: fields.goal, neededBy: month, share, paused },
    savedBefore: held ?? 0,
    futureYou,
    cycle: snap.cycle,
  });
  const perDay = aboutPerDay(
    monthly,
    snap.cycle.daysLeft,
    joinedShare(snap.cycle, snap.plan?.startedOn ?? null),
  );
  const summary = paused
    ? { title: t('plan.pot.sumPaused'), sub: t('plan.pot.sumPausedSub') }
    : goalKind
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

  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    const patch: PotPatch = {
      name: fields.name,
      icon: fields.icon,
      hue: fields.hue,
      goal: fields.goal,
      neededBy: month,
      paused,
      ...(goalKind && goals > 1 ? { share: percent / 100 } : {}),
    };
    if (!(await run(() => actions.updatePot(pot.id, patch)))) {
      busy.current = false;
      setWorking(false);
      return;
    }
    left.current = true;
    haptics.success();
    router.back();
  };

  const remove = async () => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    if (!(await run(() => actions.archivePot(pot.id)))) {
      busy.current = false;
      setWorking(false);
      return;
    }
    left.current = true;
    haptics.tap();
    router.back();
    offerUndo(t('plan.pot.deleted', { name: pot.name }), t('plan.pot.undo'), () => {
      void run(() => actions.restorePot(pot.id));
    });
  };

  return (
    <PotSheet
      title={goalKind ? t('plan.goal.editTitle') : t('plan.pot.editTitle')}
      placeholder={goalKind ? t('plan.goal.placeholder') : t('plan.pot.placeholder')}
      fields={fields}
      onChange={(patch) => setFields((f) => (f ? { ...f, ...patch } : f))}
      month={month}
      monthLabel={month ? format.monthLong(month) : t('plan.pot.noDate')}
      canEarlier={canStepNeededBy(month, -1, from)}
      canLater={canStepNeededBy(month, 1, from)}
      onStepMonth={(by) => setMonth((m) => stepNeededBy(m, by, from))}
      rows={
        <>
          {goalKind && goals > 1 ? (
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
          ) : null}
          <View style={[potRow, { borderTopWidth: 0.5, borderColor: palette.hair }]}>
            <View style={{ flex: 1, gap: 2, paddingVertical: 8 }}>
              <Text style={{ ...body(16), color: palette.ink }}>{t('plan.pot.pause')}</Text>
              <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>
                {t('plan.pot.pauseSub')}
              </Text>
            </View>
            <Switch value={paused} onChange={setPaused} accessibilityLabel={t('plan.pot.pause')} />
          </View>
        </>
      }
      summary={summary}
      cta={{
        label: t('plan.pot.save'),
        enabled: !working && held !== null,
        onPress: () => void save(),
      }}
      footer={
        <PressScale
          accessibilityRole="button"
          disabled={working}
          onPress={() => void remove()}
          style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ ...body(16, 600), color: palette.inkSoft }}>
            {goalKind ? t('plan.goal.delete') : t('plan.pot.delete')}
          </Text>
        </PressScale>
      }
    />
  );
}
