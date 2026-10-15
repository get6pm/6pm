import { randomUUID } from 'expo-crypto';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  potTopUpStep,
  sharedPotMonthly,
  sharedPotProgress,
  sharedTopUp,
  type PayCycle,
  type SharedPot,
  type TogetherMember,
} from '@6pm/domain';
import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { jarTint, type PlanColours } from '../plan/plan-colours';
import { Pill } from '../plan/plan-parts';
import { usePotMoney } from './pot-money';
import { useTogetherRun } from './together-provider';

const ease = Easing.bezier(...curves.enter);
export const JAR_W = 150;
export const JAR_H = 204;
const FILL_MS = 600;

export const sharedPotRoute = (id: string) => `/shared-pot/${id}` as Href;

/**
 * A shared pot as a jar card, the size and fill of an occasion's (`App:355-368`): the jar fills
 * with what both partners put in, "+100k" adds the person's own, and the line under the name says
 * who put in what.
 */
export function SharedJar({
  pot,
  me,
  partner,
  cycle,
  colours,
}: {
  readonly pot: SharedPot;
  readonly me: TogetherMember;
  readonly partner: TogetherMember | null;
  readonly cycle: PayCycle;
  readonly colours: PlanColours;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { currency, money } = usePotMoney(pot.currency);
  const router = useRouter();
  const run = useTogetherRun();
  const say = useCompanionToast();
  const reduceMotion = useReducedMotion();
  const memberIds = partner === null ? [me.id] : [me.id, partner.id];
  const progress = sharedPotProgress(pot.goal, pot.contributions, memberIds);
  const monthly = sharedPotMonthly(pot.goal, progress.saved, pot.neededBy, cycle, currency);
  const level = Math.max(0.06, progress.progress);
  const fill = useSharedValue(level);
  useEffect(() => {
    fill.value = withTiming(level, { duration: reduceMotion ? 0 : FILL_MS, easing: ease });
  }, [level, fill, reduceMotion]);
  const fillStyle = useAnimatedStyle(() => ({ height: fill.value * JAR_H }));
  const jar = jarTint(pot.hue, palette.dark);
  const { full } = progress;
  const short = (n: number) => money.short(n);
  const step = potTopUpStep(pot.goal, currency);
  const mine = progress.byMember[me.id] ?? 0;
  const theirs = partner === null ? 0 : (progress.byMember[partner.id] ?? 0);

  const add = () => {
    const amount = sharedTopUp(pot.goal, progress.saved, step);
    if (amount === 0) return;
    haptics.tap();
    void run({
      kind: 'addContribution',
      id: randomUUID(),
      potId: pot.id,
      amount,
      addedAt: new Date().toISOString(),
    }).then((ok) => {
      if (ok && progress.saved + amount >= pot.goal) say('potFull');
    });
  };
  const open = () => {
    haptics.tap();
    router.push(sharedPotRoute(pot.id));
  };

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('plan.occasions.edit', { name: pot.name })}
      scaleTo={0.98}
      onPress={open}
      onLongPress={open}
      style={{
        width: JAR_W,
        height: JAR_H,
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View style={{ flex: 1, borderRadius: 26, overflow: 'hidden', padding: 14 }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: jar.fill,
              borderTopWidth: 1.5,
              borderColor: jar.edge,
            },
            fillStyle,
          ]}
        />
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <CategoryTile
              icon={isSymbolName(pot.icon) ? pot.icon : 'group'}
              hue={pot.hue}
              size={40}
              radius={14}
              glyph={22}
            />
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={
                full
                  ? t('plan.occasions.full')
                  : t('together.jar.add', { amount: short(step), name: pot.name })
              }
              onPress={add}
              style={{
                height: 32,
                paddingLeft: 7,
                paddingRight: 11,
                borderRadius: 99,
                backgroundColor: full ? colours.okBg : palette.chipBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Symbol
                name={full ? 'check' : 'add'}
                size={17}
                color={full ? colours.ok : palette.ink}
              />
              <Text style={{ ...body(12.5, 700), color: full ? colours.ok : palette.ink }}>
                {full ? t('plan.occasions.full') : short(step)}
              </Text>
            </PressScale>
          </View>
          <View style={{ gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ ...display(30, 500, -0.02), lineHeight: 30, color: palette.ink }}>
                {short(progress.saved)}
              </Text>
              <Text style={{ ...body(12.5, 600), color: palette.inkSoft }}>
                {t('plan.occasions.of', { amount: short(pot.goal) })}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{ ...body(14, 650), lineHeight: 16.8, paddingTop: 3, color: palette.ink }}
            >
              {pot.name}
            </Text>
            <Text numberOfLines={1} style={{ ...body(12), color: palette.inkSoft }}>
              {partner === null
                ? t('together.jar.mine', { mine: short(mine) })
                : t('together.jar.split', {
                    mine: short(mine),
                    partner: partner.name ?? t('together.partner'),
                    theirs: short(theirs),
                  })}
            </Text>
            <View style={{ marginTop: 5 }}>
              <Pill
                label={
                  full
                    ? t('plan.occasions.ready')
                    : monthly > 0
                      ? t('plan.occasions.monthly', { amount: short(monthly) })
                      : t('plan.occasions.whenever')
                }
                bg={full ? colours.okBg : palette.chipBg}
                fg={full ? colours.ok : palette.inkSoft}
                padX={8}
              />
            </View>
          </View>
        </View>
      </View>
    </PressScale>
  );
}
