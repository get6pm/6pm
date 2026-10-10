import { useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { WeekRecap } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { body, mono } from '../../ui/type/fonts';
import { BarsPage, PlacesPage, StoryPage } from './recap-pages';

const PAGES = 3;
/** A drag past this many points turns the page (the prototype's ±40). */
const TURN = 40;
const settle = Easing.bezier(0.2, 0.9, 0.25, 1.15);
const SETTLE_MS = 450;
const REDUCED_MS = 200;
const DOT_MS = 300;

function PageDot({ active }: { readonly active: boolean }) {
  const { palette } = useTheme();
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 20 : 6, { duration: DOT_MS }),
    opacity: withTiming(active ? 0.9 : 0.25, { duration: DOT_MS }),
  }));
  return (
    <Animated.View style={[{ height: 6, borderRadius: 6, backgroundColor: palette.ink }, style]} />
  );
}

/**
 * The week so far, three pages on one card: the story, the bars, where it went. Tap for the next
 * page or swipe either way; the card leans after the finger (a third of the drag, a degree per
 * 220 pt) and springs back as the page turns.
 */
export function WeekRecapCard({
  recap,
  kicker,
  letters,
}: {
  readonly recap: WeekRecap;
  readonly kicker: string;
  readonly letters: readonly string[];
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const dx = useSharedValue(0);

  const turn = (by: number) => {
    haptics.tick();
    setPage((p) => (p + by + PAGES) % PAGES);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      dx.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -TURN) runOnJS(turn)(1);
      else if (e.translationX > TURN) runOnJS(turn)(-1);
    })
    .onFinalize(() => {
      dx.value = withTiming(0, {
        duration: reduceMotion ? REDUCED_MS : SETTLE_MS,
        easing: settle,
      });
    });
  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd((_e, success) => {
      if (success) runOnJS(turn)(1);
    });

  const lean = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value * 0.3 }, { rotate: `${dx.value / 220}deg` }],
  }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View
        accessibilityRole="button"
        accessibilityHint={t('diary.recap.hint')}
        style={[
          {
            borderRadius: 26,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            paddingTop: 20,
            paddingHorizontal: 18,
            paddingBottom: 16,
            gap: 16,
            minHeight: 318,
            overflow: 'hidden',
          },
          lean,
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ ...mono(11, 400, 0.12), color: palette.inkSoft }}>{kicker}</Text>
          <Text style={{ ...mono(11, 400, 0.12), color: palette.inkSoft }}>
            {page + 1} / {PAGES}
          </Text>
        </View>
        <Animated.View key={page} entering={FadeIn.duration(350)} style={{ flex: 1 }}>
          {page === 0 ? <StoryPage story={recap.story} /> : null}
          {page === 1 ? <BarsPage recap={recap} letters={letters} /> : null}
          {page === 2 ? <PlacesPage recap={recap} /> : null}
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {Array.from({ length: PAGES }, (_, i) => (
            <PageDot key={i} active={i === page} />
          ))}
          <View style={{ flex: 1 }} />
          <Text style={{ ...body(13, 600), color: palette.inkSoft }}>{t('diary.recap.hint')}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
