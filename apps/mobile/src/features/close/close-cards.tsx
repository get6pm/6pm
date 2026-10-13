import { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { CardVerdict } from '@6pm/domain';

import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { release, rubberband } from '../../ui/motion/physics';
import { unband } from '../../ui/motion/use-drag-dismiss';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, mono } from '../../ui/type/fonts';
import { cardFling } from './card-fling';
import { CloseCard, type CloseCardContent } from './close-card';

/** Off the screen to the right (kept) and below (not mine). */
const AWAY_X = 560;
const AWAY_Y = 820;
/** The card's height: how far above home it can be pulled before it stops giving. */
const STACK = 390;
const COMMIT_MS = 300;
const reduceMotion = ReduceMotion.System;

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
    const prog = Math.min(1, Math.hypot(dx.get(), dy.get()) / 140);
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
 * The three round buttons and the stack of cards for one top card. It is keyed by the top card, so
 * each new top card mounts with its own drag at zero: nothing is reset after a fling, and the next
 * card is already where the old top card's drag had brought it.
 */
function CardStack({
  cards,
  buttons,
  onDecide,
  onEdit,
}: Pick<CloseCardsProps, 'cards' | 'buttons' | 'onDecide' | 'onEdit'>) {
  const { palette } = useTheme();
  const top = cards[0];
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const id = top?.row.id;

  const decide = useCallback(
    (verdict: 'kept' | 'notMine') => {
      if (id) onDecide(id, verdict);
    },
    [id, onDecide],
  );
  const edit = useCallback(() => {
    if (id) onEdit(id);
  }, [id, onEdit]);

  /** Home again, carrying whatever speed the finger let go with. */
  const settle = useCallback(
    (vx: number, vy: number) => {
      'worklet';
      dx.set(withSpring(0, { ...release.home, velocity: vx, reduceMotion }));
      dy.set(withSpring(0, { ...release.home, velocity: vy, reduceMotion }));
    },
    [dx, dy],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart((e) => {
          // A card caught mid-flight is picked up where it is.
          const y = dy.get();
          startX.set(dx.get() - e.translationX);
          startY.set((y < 0 ? unband(y, STACK) : y) - e.translationY);
        })
        .onUpdate((e) => {
          const y = startY.get() + e.translationY;
          dx.set(startX.get() + e.translationX);
          dy.set(y >= 0 ? y : rubberband(y, STACK));
        })
        .onEnd((e) => {
          const verdict = cardFling(dx.get(), dy.get(), e.velocityX, e.velocityY);
          if (verdict === null) {
            settle(e.velocityX, e.velocityY);
            return;
          }
          // The tap lands as the finger lets go, not when the card is gone.
          scheduleOnRN(haptics.tap);
          if (verdict === 'edit') {
            settle(e.velocityX, e.velocityY);
            scheduleOnRN(edit);
            return;
          }
          const done = (finished?: boolean) => {
            'worklet';
            if (finished) scheduleOnRN(decide, verdict);
          };
          const away = { ...release.away, reduceMotion };
          if (verdict === 'kept') {
            dx.set(withSpring(AWAY_X, { ...away, velocity: e.velocityX }, done));
          } else {
            dy.set(withSpring(AWAY_Y, { ...away, velocity: e.velocityY }, done));
          }
        }),
    [dx, dy, startX, startY, settle, edit, decide],
  );

  // The buttons have no finger speed to carry, so the card leaves on the house ease-out.
  const press = (verdict: 'kept' | 'notMine' | 'edit') => {
    if (!top) return;
    haptics.tap();
    if (verdict === 'edit') {
      settle(0, 0);
      edit();
      return;
    }
    const done = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(decide, verdict);
    };
    const leave = { duration: COMMIT_MS, easing: easeOut, reduceMotion };
    if (verdict === 'kept') dx.set(withTiming(AWAY_X, leave, done));
    else dy.set(withTiming(AWAY_Y, leave, done));
  };

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx.get() },
      { translateY: dy.get() },
      { rotate: `${dx.get() / 18}deg` },
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
    <>
      <View style={{ height: STACK }}>
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
        {button('edit', buttons.edit, false, () => press('edit'))}
        {button('south', buttons.notMine, false, () => press('notMine'))}
        {button('check', buttons.keep, true, () => press('kept'))}
      </View>
    </>
  );
}

/**
 * The cards step: drag the top card right to keep, left to edit, down if it isn't yours, or use
 * the three buttons. A flung card leaves at the finger's speed and is decided once it is gone.
 */
export function CloseCards(props: CloseCardsProps) {
  const { palette } = useTheme();
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
              hitSlop={6}
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
      <CardStack
        key={props.cards[0]?.row.id ?? 'none'}
        cards={props.cards}
        buttons={props.buttons}
        onDecide={props.onDecide}
        onEdit={props.onEdit}
      />
    </View>
  );
}
