import { useState, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { BillCardFace, type BillCardProps } from './bill-card';
import type { DeckItem } from './bill-deck';
import { ease, useMountProgress } from './onboarding-motion';
import type { OnboardingPalette } from './onboarding-palette';

/** Where the deck is: the card on top, and the one just flung off it (if any). */
export interface DeckNav {
  readonly index: number;
  readonly from: number | null;
  readonly direction: 1 | -1;
  /** Counts moves, so each new pair of cards mounts fresh and plays its animation. */
  readonly moves: number;
}

export const DECK_START: DeckNav = { index: 0, from: null, direction: 1, moves: 0 };

/** A question card's height in the design; a longer question or more rows grow it to fit. */
const DECK_HEIGHT = 340;
/**
 * An amount card holds its question and three wheel rows (126 pt) above its buttons: 372 pt fits a
 * two-line question, where the design's 340 pt let the wheels run into the buttons. A longer
 * question or subline (a narrower phone, a longer bill name) grows it to what the card measures.
 */
const AMOUNT_DECK_HEIGHT = 372;

/**
 * The fit to keep: the same object when nothing changed, so a card that reports its height on
 * every render never sets state that renders it again.
 */
function sameFit(
  prev: { readonly index: number; readonly height: number } | null,
  index: number,
  height: number,
): { readonly index: number; readonly height: number } {
  return prev?.index === index && prev.height === height ? prev : { index, height };
}

/** `cardIn`: up 22 pt from 94% and in, with a slight overshoot, .42 s. */
function DealtCard({ children }: { readonly children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const p = useMountProgress(420, ease.card);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: reduceMotion
      ? []
      : [{ translateY: 22 * (1 - p.value) }, { scale: 0.94 + 0.06 * p.value }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', inset: 0, zIndex: 2 }, style]}>
      {children}
    </Animated.View>
  );
}

/** `flyR` / `flyL`: off the side it was answered toward, tipping 10°, .45 s. */
function FlungCard({
  direction,
  width,
  children,
}: {
  readonly direction: 1 | -1;
  readonly width: number;
  readonly children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const p = useMountProgress(450, ease.fling);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: reduceMotion
      ? []
      : [
          { translateX: direction * 1.15 * width * p.value },
          { rotate: `${direction * 10 * p.value}deg` },
        ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', inset: 0, zIndex: 3 }, style]}
    >
      {children}
    </Animated.View>
  );
}

function Peek({
  shown,
  inset,
  top,
  opacity,
  shadow,
  pal,
}: {
  readonly shown: boolean;
  readonly inset: number;
  readonly top: number;
  readonly opacity: number;
  readonly shadow: boolean;
  readonly pal: OnboardingPalette;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(shown ? opacity : 0, { duration: 300 }),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: inset,
          right: inset,
          top,
          bottom: -top * (10 / 12),
          borderRadius: 30,
          backgroundColor: pal.cell,
          boxShadow: shadow ? pal.cardShadow : 'none',
        },
        style,
      ]}
    />
  );
}

/**
 * The deck: the top card, the one just answered flying off on top of it, and up to two cards
 * peeking underneath while more are left.
 */
export function BillDeckView({
  deck,
  nav,
  card,
}: {
  readonly deck: readonly DeckItem[];
  readonly nav: DeckNav;
  readonly card: Omit<BillCardProps, 'item' | 'deckIndex'>;
}) {
  const [width, setWidth] = useState(362);
  const left = deck.length - nav.index;
  const reduceMotion = useReducedMotion();
  const tall = deck[nav.index]?.type === 'amount';
  // What the top card measured it needs, kept with its index so one card's never sizes the next.
  const [fit, setFit] = useState<{ readonly index: number; readonly height: number } | null>(null);
  const needed = fit?.index === nav.index ? fit.height : 0;
  const height = useAnimatedStyle(() => {
    const target = Math.max(tall ? AMOUNT_DECK_HEIGHT : DECK_HEIGHT, needed);
    return {
      height: reduceMotion ? target : withTiming(target, { duration: 420, easing: ease.card }),
    };
  });
  const face = (index: number, top: boolean) => (
    <BillCardFace
      {...card}
      item={deck[index] ?? null}
      deckIndex={index}
      {...(top ? { onHeight: (h: number) => setFit((prev) => sameFit(prev, index, h)) } : {})}
    />
  );
  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[{ flexShrink: 0 }, height]}
    >
      <Peek shown={left > 2} inset={28} top={24} opacity={0.35} shadow={false} pal={card.pal} />
      <Peek shown={left > 1} inset={14} top={12} opacity={0.6} shadow pal={card.pal} />
      <DealtCard key={`in-${nav.moves}`}>{face(nav.index, true)}</DealtCard>
      {nav.from !== null ? (
        <FlungCard key={`out-${nav.moves}`} direction={nav.direction} width={width}>
          {face(nav.from, false)}
        </FlungCard>
      ) : null}
    </Animated.View>
  );
}
