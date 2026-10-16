import { Canvas, Circle, Path, rect, Skia } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { aboutPerDay, potTopUp } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { usePlanActions } from '../../data/plan-actions';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useCompanionToast } from '../companion/use-companion-toast';
import { useRunAction } from '../companion/use-run-action';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import type { PlanColours } from './plan-colours';
import type { PlanFormat } from './plan-format';
import { ChipButton, Pill } from './plan-parts';
import { planRoutes } from './plan-routes';
import { shareSplit, topUpIn, type GoalView } from './plan-view';

const ease = Easing.bezier(...curves.enter);
const RING = 58;
const STROKE = 6;

/** The goal's progress ring: the prototype's conic fill under a 46 pt cell-coloured disc. */
function GoalRing({
  progress,
  colours,
  label,
}: {
  readonly progress: number;
  readonly colours: PlanColours;
  readonly label: string;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const end = useSharedValue(progress);
  useEffect(() => {
    end.value = withTiming(progress, { duration: reduceMotion ? 0 : 400, easing: ease });
  }, [progress, end, reduceMotion]);
  const arc = useMemo(() => {
    const r = (RING - STROKE) / 2;
    const c = RING / 2;
    return Skia.PathBuilder.Make()
      .addArc(rect(c - r, c - r, 2 * r, 2 * r), -90, 359.999)
      .build();
  }, []);
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ position: 'absolute', width: RING, height: RING }}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={(RING - STROKE) / 2}
          style="stroke"
          strokeWidth={STROKE}
          color={colours.ringTrack}
        />
        <Path
          path={arc}
          style="stroke"
          strokeWidth={STROKE}
          color={colours.ringFill}
          start={0}
          end={end}
        />
      </Canvas>
      <Text style={{ ...display(15, 500), ...tabular, color: palette.ink }}>{label}</Text>
    </View>
  );
}

/**
 * Future you: the payday auto-save, each goal with its ring, pace and +100k, and what an extra
 * 100k costs a day until payday.
 */
export function FutureYouCard({
  goals,
  futureYou,
  daysLeft,
  colours,
  format,
}: {
  readonly goals: readonly GoalView[];
  readonly futureYou: number;
  readonly daysLeft: number;
  readonly colours: PlanColours;
  readonly format: PlanFormat;
}) {
  const { palette } = useTheme();
  const { t, weekday } = useI18n();
  const money = useMoneyFormat();
  const topUp = topUpIn(money.currency);
  const say = useCompanionToast();
  const actions = usePlanActions();
  const run = useRunAction();
  const router = useRouter();
  const split = shareSplit(goals);
  const step = money.short(topUp);
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        padding: 16,
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 18,
          backgroundColor: palette.chipBg,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colours.autoTile,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol
            name={futureYou ? 'event_repeat' : 'pause_circle'}
            size={21}
            fill={1}
            color={colours.autoGlyph}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ ...body(15, 650), color: palette.ink }}>
            {futureYou
              ? t('plan.future.autoTitle', { amount: money.short(futureYou) })
              : t('plan.future.pausedTitle')}
          </Text>
          <Text style={{ ...body(13), lineHeight: 17.55, color: palette.inkSoft }}>
            {!futureYou
              ? t('plan.future.pausedSub')
              : split
                ? t('plan.future.autoSub', { split })
                : t('plan.future.autoSubOne')}
          </Text>
        </View>
      </View>
      {goals.map((g) => {
        const { status, eta, monthly } = g.plan;
        const by = g.pot.neededBy ? format.monthShort(g.pot.neededBy) : '';
        const etaText =
          status === 'reached'
            ? t('plan.future.eta.reached')
            : status === 'paused' || eta === null
              ? t('plan.future.eta.paused')
              : t('plan.future.eta.ready', { month: format.monthShort(eta) });
        const statusText =
          status === 'reached'
            ? t('plan.future.status.reached')
            : status === 'paused'
              ? t('plan.future.status.paused')
              : status === 'onTrack'
                ? t('plan.future.status.onTrack', { month: by })
                : status === 'behind'
                  ? t('plan.future.status.behind', { month: by })
                  : t('plan.future.status.steady', { amount: money.short(monthly) });
        const ok = status !== 'behind' && status !== 'paused';
        const add = potTopUp(g.pot.goal, g.saved, topUp);
        return (
          <View
            key={g.pot.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 2 }}
          >
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={t('plan.future.edit', { name: g.pot.name })}
              scaleTo={0.98}
              onPress={() => {
                haptics.tap();
                router.push(planRoutes.pot(g.pot.id));
              }}
              style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <GoalRing
                progress={g.progress}
                colours={colours}
                label={`${Math.round(g.progress * 100)}%`}
              />
              <View style={{ flex: 1, minWidth: 0, gap: 5, alignItems: 'flex-start' }}>
                <Text style={{ ...body(16, 650), lineHeight: 19.2, color: palette.ink }}>
                  {g.pot.name}
                </Text>
                <Text style={{ ...body(13), ...tabular, color: palette.inkSoft }}>
                  {t('plan.future.progress', {
                    have: money.short(g.saved),
                    goal: money.short(g.pot.goal),
                    eta: etaText,
                  })}
                </Text>
                <Pill
                  label={statusText}
                  bg={ok ? colours.okBg : colours.behindBg}
                  fg={ok ? colours.ok : colours.warn}
                  padX={9}
                />
              </View>
            </PressScale>
            {/* A full goal takes no more; the last tap adds only what is left. */}
            {add > 0 ? (
              <ChipButton
                label={`+${money.short(add)}`}
                accessibilityLabel={t('plan.future.add', {
                  amount: money.short(add),
                  name: g.pot.name,
                })}
                onPress={() => {
                  haptics.tap();
                  void run(() => actions.topUp(g.pot.id, add));
                  say('save', { day: weekday(new Date()) });
                }}
              />
            ) : null}
          </View>
        );
      })}
      <PressScale
        accessibilityRole="button"
        onPress={() => {
          haptics.tap();
          router.push(planRoutes.newGoal);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 18,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colours.dashLine,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: palette.chipBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="add" size={21} color={palette.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ ...body(15, 650), color: palette.ink }}>{t('plan.future.newGoal')}</Text>
          <Text style={{ ...body(13), lineHeight: 17.55, color: palette.inkSoft }}>
            {t('plan.future.newGoalSub')}
          </Text>
        </View>
      </PressScale>
      <Text
        style={{
          ...body(12.5),
          lineHeight: 17.5,
          color: palette.inkSoft,
          paddingTop: 12,
          paddingHorizontal: 2,
          borderTopWidth: 0.5,
          borderColor: palette.hair,
        }}
      >
        {t('plan.future.note', {
          step,
          amount: money.short(aboutPerDay(topUp, daysLeft, 1, money.currency)),
        })}
      </Text>
    </View>
  );
}
