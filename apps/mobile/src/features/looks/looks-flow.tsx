import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, paletteFor, type LookId } from '@6pm/theme';

import { useDesignInsets } from '../../ui/layout/design-insets';
import { useDragDismiss } from '../../ui/motion/use-drag-dismiss';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { neighbour, SHOP_ORDER } from './look-catalogue';
import { LookDetail } from './look-detail';
import { useLookSettings, useLookSettingsStore } from './look-settings-provider';
import { LooksShop } from './looks-shop';
import type { CardRect } from './shop-card';
import { usePagerMetrics } from './shop-pager';

/** The prototype's sheet moves between the shop and the try-on over .5 s on its entrance curve. */
const MOVE = {
  duration: 500,
  easing: Easing.bezier(...curves.enter),
  reduceMotion: ReduceMotion.System,
};
const FADE = { duration: 250, reduceMotion: ReduceMotion.System };
/** Where the try-on's sheet starts on the prototype's screen (`App:3455`). */
const TRY_ON_TOP = 400;

/** A sky growing out of a card into the page above the try-on, or shrinking back into it. */
interface Flight {
  readonly sky: string;
  readonly card: CardRect;
}

/**
 * The Looks sheet with a look's try-on inside it, as one sheet (prototype `App:864-1010`). Tapping
 * a card wears that look on the real app, and the card's sky grows out to fill the screen above
 * the sheet while the sheet sinks to make room and the shop gives way to the look's settings;
 * "‹ Looks" plays it backwards into that look's card. The dim lifts while a look is on, so the
 * page behind is seen as it is. The sheet drags down to close from either top row; closing ends
 * the try-on. Everything moves on the UI thread.
 */
export function LooksFlow({ initial }: { readonly initial: LookId | null }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { hour } = useClock();
  const { height, width } = useWindowDimensions();
  const { top } = useDesignInsets();
  const { customer } = useEntitlement();
  const { look: chosen, config } = useLookSettings();
  const store = useLookSettingsStore();
  const metrics = usePagerMetrics();

  // Level with the native sheets (Settings opens this one in its place), and where the
  // prototype puts the try-on.
  const shopTop = top(62);
  const lookTop = top(TRY_ON_TOP);
  const sink = lookTop - shopTop;

  const worn = resolveLook(chosen, customer);
  const [trying, setTrying] = useState<LookId | null>(initial);
  // The try-on's panel stays while it fades, after the look has come off.
  const [panel, setPanel] = useState<LookId | null>(initial);
  const [focus, setFocus] = useState(() => Math.max(0, SHOP_ORDER.indexOf(initial ?? worn)));
  const [shopHour, setShopHour] = useState<number | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const lastCard = useRef<CardRect | null>(null);

  const listRef = useAnimatedRef<Animated.FlatList<LookId>>();
  const scrollX = useSharedValue(focus * metrics.step);
  const mode = useSharedValue(initial ? 1 : 0);
  const fly = useSharedValue(0);
  const flyOpacity = useSharedValue(0);

  const close = useCallback(() => router.back(), [router]);
  const sheet = useDragDismiss({ area: height, onDismissed: close });

  // The look is on the real app from the first frame of its try-on, and comes off when this goes.
  useEffect(() => store.setTryOn(trying), [store, trying]);
  useEffect(() => () => store.setTryOn(null), [store]);

  // The sheet's colour in the shop is the worn look's; it is kept while another look is tried on.
  const shopBg = useRef(palette.sheetSolid);
  if (trying === null) shopBg.current = palette.sheetSolid;

  const jump = useCallback(
    (index: number) => {
      setFocus(index);
      listRef.current?.scrollToOffset({ offset: index * metrics.step, animated: true });
    },
    [listRef, metrics.step],
  );

  const open = useCallback(
    (look: LookId, card: CardRect | null) => {
      store.setTryOn(look);
      setTrying(look);
      setPanel(look);
      mode.set(withTiming(1, MOVE));
      if (!card) return;
      lastCard.current = card;
      const sky = paletteFor({
        look,
        hour: shopHour ?? hour,
        serious: false,
        config: config[look] ?? {},
      }).sky;
      setFlight({ sky, card });
      fly.set(0);
      flyOpacity.set(1);
      fly.set(withTiming(1, MOVE));
      flyOpacity.set(withDelay(MOVE.duration, withTiming(0, FADE)));
    },
    [store, mode, fly, flyOpacity, shopHour, hour, config],
  );

  const back = useCallback(() => {
    if (trying === null) return;
    const index = Math.max(0, SHOP_ORDER.indexOf(trying));
    // The card it goes back into is the one in front, where the tapped card was measured.
    const card = lastCard.current;
    if (card) {
      setFlight({ sky: palette.sky, card: { ...card, x: metrics.side } });
      fly.set(1);
      flyOpacity.set(1);
      fly.set(withTiming(0, MOVE));
      flyOpacity.set(withDelay(MOVE.duration / 2, withTiming(0, FADE)));
    }
    setFocus(index);
    listRef.current?.scrollToOffset({ offset: index * metrics.step, animated: false });
    setTrying(null);
    mode.set(
      withTiming(0, MOVE, (finished) => {
        if (finished) scheduleOnRN(setPanel, null);
      }),
    );
  }, [trying, palette.sky, metrics.side, metrics.step, listRef, fly, flyOpacity, mode]);

  const step = useCallback(
    (by: 1 | -1) => {
      if (trying === null) return;
      const next = neighbour(trying, by);
      setTrying(next);
      setPanel(next);
    },
    [trying],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mode.get() * sink + sheet.y.get() }],
  }));
  const dimStyle = useAnimatedStyle(() => ({
    opacity:
      (1 - mode.get()) *
      interpolate(sheet.y.get(), [0, sheet.travel.get()], [1, 0], Extrapolation.CLAMP),
  }));
  const shopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(mode.get(), [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));
  const lookStyle = useAnimatedStyle(() => ({
    opacity: interpolate(mode.get(), [0.3, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const lookBgStyle = useAnimatedStyle(() => ({ opacity: mode.get() }));
  const flightStyle = useAnimatedStyle(() => {
    if (!flight) return { opacity: 0 };
    const f = fly.get();
    const { card } = flight;
    return {
      opacity: flyOpacity.get(),
      left: card.x * (1 - f),
      top: card.y + (0 - card.y) * f,
      width: card.width + (width - card.width) * f,
      height: card.height + (lookTop - card.height) * f,
      borderRadius: 32 * (1 - f),
    };
  });

  const grabIn = (on: boolean) => (header: ReactNode) =>
    on ? (
      <GestureDetector gesture={sheet.drag}>
        <View collapsable={false}>{header}</View>
      </GestureDetector>
    ) : (
      <View collapsable={false}>{header}</View>
    );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, dimStyle]}>
        <Pressable
          accessibilityRole="button"
          onPress={sheet.dismiss}
          style={{ flex: 1, backgroundColor: 'rgba(10,6,18,.36)' }}
        />
      </Animated.View>

      <Animated.View
        onLayout={sheet.onLayout}
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: shopTop,
            height: height - shopTop,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            borderTopWidth: 0.5,
            borderColor: palette.glassBorder,
            boxShadow: '0 -20px 60px rgba(10,5,20,.35)',
            overflow: 'hidden',
            backgroundColor: shopBg.current,
          },
          sheetStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.sheet }, lookBgStyle]}
        />
        <Animated.View
          pointerEvents={trying === null ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, shopStyle]}
        >
          <LooksShop
            listRef={listRef}
            scrollX={scrollX}
            focus={focus}
            shopHour={shopHour}
            live={trying === null}
            onFocus={setFocus}
            onJump={jump}
            onShopHour={setShopHour}
            onOpen={open}
            onDone={sheet.dismiss}
            grab={grabIn(trying === null)}
          />
        </Animated.View>
        {panel === null ? null : (
          <Animated.View
            pointerEvents={trying === null ? 'none' : 'auto'}
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0, height: height - lookTop },
              lookStyle,
            ]}
          >
            <LookDetail
              look={panel}
              onBack={back}
              onStep={step}
              onDone={sheet.dismiss}
              grab={grabIn(trying !== null)}
            />
          </Animated.View>
        )}
      </Animated.View>

      {flight ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', overflow: 'hidden', backgroundImage: flight.sky },
            flightStyle,
          ]}
        />
      ) : null}
    </View>
  );
}
