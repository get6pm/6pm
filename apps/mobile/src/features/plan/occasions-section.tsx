import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { formatShort } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { usePlanActions } from '../../data/plan-actions';
import { useI18n } from '../../i18n/i18n';
import { useCompanionToast } from '../companion/use-companion-toast';
import { useRunAction } from '../companion/use-run-action';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { jarTint, type PlanColours } from './plan-colours';
import type { PlanFormat } from './plan-format';
import { Pill } from './plan-parts';
import { planRoutes } from './plan-routes';
import { TOP_UP, type OccasionView } from './plan-view';

const ease = Easing.bezier(...curves.enter);
const CARD_W = 150;
const CARD_H = 204;
const GAP = 10;
const FILL_MS = 600;

function Jar({
  view,
  colours,
  format,
}: {
  readonly view: OccasionView;
  readonly colours: PlanColours;
  readonly format: PlanFormat;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const actions = usePlanActions();
  const run = useRunAction();
  const say = useCompanionToast();
  const reduceMotion = useReducedMotion();
  const level = Math.max(0.06, view.progress);
  const fill = useSharedValue(level);
  useEffect(() => {
    fill.value = withTiming(level, { duration: reduceMotion ? 0 : FILL_MS, easing: ease });
  }, [level, fill, reduceMotion]);
  const fillStyle = useAnimatedStyle(() => ({ height: fill.value * CARD_H }));
  const jar = jarTint(view.pot.hue, palette.dark);
  const { pot, full } = view;
  const add = () => {
    if (full) return;
    haptics.tap();
    void run(() => actions.topUp(pot.id, TOP_UP));
    if (view.saved + TOP_UP >= pot.goal) say('potFull');
  };
  const edit = () => {
    haptics.tap();
    router.push(planRoutes.pot(pot.id));
  };
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('plan.occasions.edit', { name: pot.name })}
      scaleTo={0.98}
      onPress={edit}
      onLongPress={edit}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 26,
          overflow: 'hidden',
          padding: 14,
          justifyContent: 'space-between',
        }}
      >
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <CategoryTile
            icon={isSymbolName(pot.icon) ? pot.icon : 'celebration'}
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
                : t('plan.future.add', { amount: formatShort(TOP_UP, language), name: pot.name })
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
              {full ? t('plan.occasions.full') : formatShort(TOP_UP, language)}
            </Text>
          </PressScale>
        </View>
        <View style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ ...display(30, 500, -0.02), lineHeight: 30, color: palette.ink }}>
              {formatShort(view.saved, language)}
            </Text>
            <Text style={{ ...body(12.5, 600), color: palette.inkSoft }}>
              {t('plan.occasions.of', { amount: formatShort(pot.goal, language) })}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{ ...body(14, 650), lineHeight: 16.8, paddingTop: 3, color: palette.ink }}
          >
            {pot.name}
          </Text>
          <Text numberOfLines={1} style={{ ...body(12), color: palette.inkSoft }}>
            {pot.neededBy ? format.monthLong(pot.neededBy) : t('plan.occasions.noDate')}
          </Text>
          <View style={{ marginTop: 5 }}>
            <Pill
              label={
                full
                  ? t('plan.occasions.ready')
                  : view.paused
                    ? t('plan.occasions.paused')
                    : view.monthly > 0
                      ? t('plan.occasions.monthly', { amount: formatShort(view.monthly, language) })
                      : t('plan.occasions.whenever')
              }
              bg={full ? colours.okBg : palette.chipBg}
              fg={full ? colours.ok : palette.inkSoft}
              padX={8}
            />
          </View>
        </View>
      </View>
    </PressScale>
  );
}

/**
 * Occasions: a jar card per pot that fills as money goes in, then "New pot". The first pot is
 * free; once it exists, "New pot" carries the MAX lock and opens the Max sheet instead.
 */
export function OccasionsStrip({
  occasions,
  locked,
  colours,
  format,
}: {
  readonly occasions: readonly OccasionView[];
  /** The free pot is used and Max is not held. */
  readonly locked: boolean;
  readonly colours: PlanColours;
  readonly format: PlanFormat;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  return (
    <ScrollView
      horizontal
      scrollsToTop={false}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + GAP}
      decelerationRate="fast"
      style={{ marginHorizontal: -16, flexGrow: 0 }}
      contentContainerStyle={{ gap: GAP, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 14 }}
    >
      {occasions.map((o) => (
        <Jar key={o.pot.id} view={o} colours={colours} format={format} />
      ))}
      <PressScale
        accessibilityRole="button"
        onPress={() => {
          haptics.tap();
          if (locked) router.push({ pathname: '/max', params: { from: 'pots' } });
          else router.push('/new-pot');
        }}
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 26,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colours.dashLine,
          padding: 14,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: palette.chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="add" size={24} color={palette.ink} />
          </View>
          {locked ? (
            <View
              style={{
                height: 20,
                paddingLeft: 5,
                paddingRight: 7,
                borderRadius: 6,
                backgroundColor: palette.btnBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Symbol name="lock" size={12} fill={1} color={palette.btnFg} />
              <Text style={{ ...body(10, 800, 0.1), color: palette.btnFg }}>
                {t('plan.occasions.max')}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ ...body(16, 650), color: palette.ink }}>{t('plan.occasions.newPot')}</Text>
          <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>
            {locked ? t('plan.occasions.newPotMax') : t('plan.occasions.newPotSub')}
          </Text>
        </View>
      </PressScale>
    </ScrollView>
  );
}
