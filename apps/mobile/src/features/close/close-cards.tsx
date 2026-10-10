import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { CardVerdict } from '@6pm/domain';

import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, mono } from '../../ui/type/fonts';
import { CloseCard, type CloseCardContent } from './close-card';

const springBack = Easing.bezier(0.2, 0.9, 0.25, 1.12);
const FLING = 90;
const FLICK = 800;
const COMMIT_MS = 300;

/** A card behind the top one: it rises and grows as the top card is dragged away. */
function BackCard({
  content,
  index,
  dx,
  dy,
}: {
  readonly content: CloseCardContent;
  readonly index: number;
  readonly dx: SharedValue<number>;
  readonly dy: SharedValue<number>;
}) {
  const lift = useAnimatedStyle(() => {
    const prog = Math.min(1, Math.hypot(dx.value, dy.value) / 140);
    const k = index - prog;
    return { transform: [{ translateY: k * 14 }, { scale: 1 - k * 0.045 }] };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 4, right: 4, top: 0, zIndex: 10 - index }, lift]}
    >
      <CloseCard content={content} dx={dx} dy={dy} top={false} />
    </Animated.View>
  );
}

export interface CloseCardsProps {
  readonly cards: readonly CloseCardContent[];
  readonly kicker: string;
  readonly title: string;
  readonly hint: string;
  readonly undoText: string | null;
  readonly undoLabel: string;
  readonly buttons: { readonly edit: string; readonly notMine: string; readonly keep: string };
  readonly onDecide: (id: string, verdict: Exclude<CardVerdict, 'edited'>) => void;
  readonly onEdit: (id: string) => void;
  readonly onUndo: () => void;
}

/**
 * The cards step: drag the top card right to keep, left to edit, down if it isn't yours, or use
 * the three buttons. Flung cards leave the screen and are decided 300 ms later, as designed.
 */
export function CloseCards(props: CloseCardsProps) {
  const { palette } = useTheme();
  const { cards } = props;
  const top = cards[0];
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  const settle = () => {
    dx.value = withTiming(0, { duration: 450, easing: springBack });
    dy.value = withTiming(0, { duration: 450, easing: springBack });
  };
  const commit = (id: string, verdict: Exclude<CardVerdict, 'edited'>) => {
    props.onDecide(id, verdict);
    dx.value = 0;
    dy.value = 0;
  };
  const fling = (verdict: 'kept' | 'notMine' | 'edit') => {
    if (!top) return;
    haptics.tap();
    if (verdict === 'edit') {
      settle();
      props.onEdit(top.row.id);
      return;
    }
    const id = top.row.id;
    const done = (finished?: boolean) => {
      'worklet';
      if (finished) runOnJS(commit)(id, verdict);
    };
    if (verdict === 'kept') dx.value = withTiming(560, { duration: COMMIT_MS }, done);
    else dy.value = withTiming(820, { duration: COMMIT_MS }, done);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      dx.value = e.translationX;
      dy.value = Math.max(-40, e.translationY);
    })
    .onEnd((e) => {
      if (dx.value > FLING || e.velocityX > FLICK) runOnJS(fling)('kept');
      else if (dx.value < -FLING || e.velocityX < -FLICK) runOnJS(fling)('edit');
      else if (dy.value > FLING || e.velocityY > FLICK) runOnJS(fling)('notMine');
      else {
        dx.value = withTiming(0, { duration: 450, easing: springBack });
        dy.value = withTiming(0, { duration: 450, easing: springBack });
      }
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.value },
      { translateY: dy.value },
      { rotate: `${dx.value / 18}deg` },
    ],
  }));

  const button = (icon: SymbolName, label: string, primary: boolean, onPress: () => void) => (
    <View key={label} style={{ alignItems: 'center', gap: 7 }}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: primary ? palette.accent : palette.glass,
          borderWidth: 0.5,
          borderColor: primary ? 'rgba(255,255,255,.45)' : palette.glassBorder,
          boxShadow: primary
            ? '0 10px 26px rgba(255,120,70,.38), inset 0 1px 0 rgba(255,255,255,.5)'
            : 'none',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={icon} size={28} color={primary ? '#2a1424' : palette.ink} />
      </PressScale>
      <Text style={{ ...body(12, 600), color: palette.inkSoft }}>{label}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, gap: 20, paddingTop: 22 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ ...mono(11, 400, 0.14), color: palette.inkSoft }}>{props.kicker}</Text>
        <BalancedText style={{ ...display(40, 500, -0.01), lineHeight: 40.8, color: palette.ink }}>
          {props.title}
        </BalancedText>
        {props.undoText ? (
          <Animated.View entering={FadeInDown.duration(250)} style={{ alignSelf: 'flex-start' }}>
            <PressScale
              onPress={props.onUndo}
              style={{
                height: 32,
                paddingLeft: 9,
                paddingRight: 13,
                borderRadius: 99,
                backgroundColor: palette.glass,
                boxShadow: palette.glassShadow,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Symbol name="undo" size={18} color={palette.ink} />
              <Text
                numberOfLines={1}
                style={{ ...body(14, 600), color: palette.ink, flexShrink: 1 }}
              >
                {props.undoText}
              </Text>
              <Text style={{ ...body(14, 500), color: palette.ink, opacity: 0.55 }}>
                · {props.undoLabel}
              </Text>
            </PressScale>
          </Animated.View>
        ) : (
          <Text style={{ ...body(15), lineHeight: 32, color: palette.inkSoft }}>{props.hint}</Text>
        )}
      </View>

      <View style={{ height: 390 }}>
        {cards
          .slice(1, 3)
          .map((card, i) => (
            <BackCard key={card.row.id} content={card} index={i + 1} dx={dx} dy={dy} />
          ))
          .reverse()}
        {top ? (
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[{ position: 'absolute', left: 4, right: 4, top: 0, zIndex: 10 }, topStyle]}
            >
              <CloseCard content={top} dx={dx} dy={dy} top />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 30 }}>
        {button('edit', props.buttons.edit, false, () => fling('edit'))}
        {button('south', props.buttons.notMine, false, () => fling('notMine'))}
        {button('check', props.buttons.keep, true, () => fling('kept'))}
      </View>
    </View>
  );
}
