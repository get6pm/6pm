import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import {
  aboutPerDay,
  cycleMonth,
  joinedShare,
  openingOf,
  potSetAside,
  savedBefore,
  withOpening,
  type PotMove,
} from '@6pm/domain';

import { useMoney, useMoneyStore } from '../../data/money-provider';
import { usePlanActions, type PotPatch } from '../../data/plan-actions';
import { readPotMoves } from '../../data/pot-moves';
import { useRunAction } from '../../features/companion/use-run-action';
import { StepperRow } from '../../features/plan/pot-rows';
import { PotSheet, type PotFields } from '../../features/plan/pot-sheet';
import { PauseRow } from '../../features/plan/pot-sheet-rows';
import { usePotCost } from '../../features/plan/use-pot-cost';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { Switch } from '../../ui/primitives/switch';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useOfferUndo } from '../../ui/undo/undo-host';

const SHARE_STEP = 5;

/**
 * A saved pot or goal: what it holds so far; change its name, look, goal and month, give a goal
 * a different share of Future you, pause it (it sets nothing aside until it is turned back on) or
 * delete it.
 */
export default function EditPot() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { palette } = useTheme();
  const run = useRunAction();
  const offerUndo = useOfferUndo();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = usePlanActions();
  const pot = snap.pots.find((p) => p.id === id);
  const [fields, setFields] = useState<PotFields | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [percent, setPercent] = useState(100);
  const [moves, setMoves] = useState<readonly PotMove[] | null>(null);
  const [opening, setOpening] = useState<number | null>(null);
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

  // The pot's moves: what it held when this cycle began, so the sheet shows the set-aside it will
  // really take, and what it held before 6pm, the "Already saved" row's starting amount.
  const startOfCycle = snap.cycle.start;
  useEffect(() => {
    let live = true;
    readPotMoves(store.db).then(
      (read) => {
        if (!live) return;
        setMoves(read);
        setOpening((o) => o ?? openingOf(read, id ?? ''));
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

  const goalKind = pot?.kind === 'goal';
  const goals = snap.pots.filter((p) => p.kind === 'goal').length;
  const futureYou = snap.plan?.futureYou ?? 0;
  const from = cycleMonth(snap.cycle);
  const share = goalKind ? (goals > 1 ? percent / 100 : 1) : null;
  const goal = fields?.goal ?? 0;
  // With "Already saved" as typed: it counts as held before every cycle.
  const held =
    moves === null
      ? null
      : withOpening(savedBefore(moves, id ?? '', startOfCycle), moves, id ?? '', opening ?? 0);
  const monthly = potSetAside({
    pot: { kind: pot?.kind ?? 'occasion', goal, neededBy: month, share, paused },
    savedBefore: held ?? 0,
    futureYou,
    cycle: snap.cycle,
    currency: money.currency,
  });
  const perDay = aboutPerDay(
    monthly,
    snap.cycle.daysLeft,
    joinedShare(snap.cycle, snap.plan?.startedOn ?? null),
    money.currency,
  );
  const { cost, fitsFrom, goalHint } = usePotCost({
    potId: pot?.id ?? '',
    goalKind,
    goal,
    saved: held ?? 0,
    monthly,
    perDay,
    month,
    paused,
    from,
    onMonth: setMonth,
  });

  if (!pot || !fields) return null;
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
      ...(moves && opening !== openingOf(moves, pot.id) ? { opening: opening ?? 0 } : {}),
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

  const pauseLabel = goalKind ? t('plan.goal.pause') : t('plan.pot.pause');

  return (
    <PotSheet
      title={goalKind ? t('plan.goal.editTitle') : t('plan.pot.editTitle')}
      placeholder={goalKind ? t('plan.goal.placeholder') : t('plan.pot.placeholder')}
      fields={fields}
      onChange={(patch) => setFields((f) => (f ? { ...f, ...patch } : f))}
      month={month}
      onMonth={setMonth}
      from={from}
      saved={
        moves
          ? withOpening(snap.potSaved[pot.id] ?? 0, moves, pot.id, opening ?? 0)
          : (snap.potSaved[pot.id] ?? 0)
      }
      opening={{ amount: opening ?? 0, onChange: setOpening }}
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
              first
              onStep={(by) =>
                setPercent((p) =>
                  Math.min(100 - SHARE_STEP, Math.max(SHARE_STEP, p + by * SHARE_STEP)),
                )
              }
            />
          ) : null}
          <PauseRow
            label={pauseLabel}
            first={!(goalKind && goals > 1)}
            control={<Switch value={paused} onChange={setPaused} accessibilityLabel={pauseLabel} />}
          />
        </>
      }
      cost={cost}
      fitsFrom={fitsFrom}
      goalHint={goalHint}
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
          style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ ...body(16, 600), color: palette.inkSoft }}>
            {goalKind ? t('plan.goal.delete') : t('plan.pot.delete')}
          </Text>
        </PressScale>
      }
    />
  );
}
