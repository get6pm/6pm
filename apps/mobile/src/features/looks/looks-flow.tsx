import { useNavigation, useRouter } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import type { ParamListBase } from 'expo-router/react-navigation';
import type { SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { curves, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useScrollDismiss, useSheetDrag } from '../../ui/motion/use-sheet-drag';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { CardFlight } from './card-flight';
import { neighbour, SHOP_ORDER } from './look-catalogue';
import { lookCopy } from './look-copy';
import { LookDetail } from './look-detail';
import { useLookSettings, useLookSettingsStore } from './look-settings-provider';
import { LooksShop } from './looks-shop';
import { snapshotOf, type CardHandle, type CardRect } from './shop-card';
import { usePagerMetrics } from './shop-pager';

const reduceMotion = ReduceMotion.System;
/** The prototype's sheet moves between the shop and the try-on over .5 s on its entrance curve. */
const MOVE = { duration: 500, easing: Easing.bezier(...curves.enter), reduceMotion };
/**
 * A card's flight and the sheet making room for it share one spring, as iOS expands a card: it
 * starts briskly, eases in over the last third, and lands with a breath of give.
 */
const FLIGHT = { mass: 1, stiffness: 170, damping: 23, reduceMotion };
/** How far along the flight is when the try-on starts to show: the spring's long tail is not waited for. */
const LANDING = 0.97;
/** The flown sky gives way to the page behind it. */
const REVEAL = { duration: 260, easing: Easing.out(Easing.quad), reduceMotion };
/** The sky covers the page before it flies back into its card. */
const COVER = { duration: 140, easing: Easing.out(Easing.quad), reduceMotion };
/** Where the try-on's sheet starts on the prototype's screen (`App:3455`). */
const TRY_ON_TOP = 400;
const SHEET_RADIUS = 40;

/** A card's sky on its way out to the page, or back into its card. */
interface Flight {
  readonly look: LookId;
  readonly hour: number;
  readonly card: CardRect;
  readonly cta: string;
  readonly way: 'out' | 'back';
  readonly image: SkImage | null;
}

/**
 * The Looks sheet with a look's try-on inside it, as one sheet (prototype `App:864-1010`).
 *
 * Tapping a card flies its sky out of the card to fill the screen while the sheet sinks to the
 * try-on's height; once the sky covers the page the look goes on, and the sky gives way to the
 * real page wearing it as the try-on fades in. "‹ Looks" plays it back: the page's sky covers it,
 * the look comes off underneath, and the sky shrinks into its card as the sheet rises. The look
 * changes only under the flown sky, so the app's re-render never shows and never meets a moving
 * frame. The sheet slides up when it is shown, and its top row or its scroll, pulled down from
 * the top, closes it from either part; closing ends the try-on.
 */
export function LooksFlow({ initial }: { readonly initial: LookId | null }) {
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { palette } = useTheme();
  const { t } = useI18n();
  const { hour } = useClock();
  const { width, height } = useWindowDimensions();
  const { top } = useDesignInsets();
  const { customer } = useEntitlement();
  const { look: chosen, config } = useLookSettings();
  const store = useLookSettingsStore();
  const metrics = usePagerMetrics();
  const copy = useMemo(() => lookCopy(t), [t]);

  // Level with the native sheets (Settings opens this one in its place), and where the
  // prototype puts the try-on.
  const shopTop = top(62);
  const lookTop = top(TRY_ON_TOP);
  const sink = lookTop - shopTop;

  const worn = resolveLook(chosen, customer);
  /** The look on the app. */
  const [trying, setTrying] = useState<LookId | null>(initial);
  /** The look in the try-on panel, kept while the panel fades. */
  const [panel, setPanel] = useState<LookId | null>(initial);
  const [focus, setFocus] = useState(() => Math.max(0, SHOP_ORDER.indexOf(initial ?? worn)));
  const [shopHour, setShopHour] = useState<number | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  const listRef = useAnimatedRef<Animated.FlatList<LookId>>();
  const cards = useRef(new Map<LookId, CardHandle>());
  const register = useCallback((look: LookId, card: CardHandle | null) => {
    if (card) cards.current.set(look, card);
    else cards.current.delete(look);
  }, []);
  /** The card stays in the pager until its picture starts to move. */
  const [flying, setFlying] = useState(false);
  const mode = useSharedValue(initial ? 1 : 0);
  const detailShown = useSharedValue(initial ? 1 : 0);
  const fly = useSharedValue(0);
  /** Which way a flight is heading, for its landing: 1 out, -1 back, 0 none. */
  const landing = useSharedValue(0);
  const flyOpacity = useSharedValue(0);

  const close = useCallback(() => router.back(), [router]);
  // In a try-on, pulling the sheet down goes back to the shop; from the shop it closes.
  const inTryOn = useSharedValue(initial !== null);
  const backRef = useRef<() => void>(() => undefined);
  const stepBack = useCallback(() => backRef.current(), []);
  const sheet = useSheetDrag({
    area: height,
    onDismissed: close,
    stepBack: inTryOn,
    onStepBack: stepBack,
  });
  const shopScroll = useScrollDismiss(sheet);
  const detailScroll = useScrollDismiss(sheet);

  // The sheet slides up as iOS puts its screen on: the modal waits for the sheet it replaces to
  // go, so a slide started on mount would end before it is seen. It goes up light: the shop's
  // cards, each a live sky, are built once it is up, so they never hold the slide back.
  const [settled, setSettled] = useState(initial !== null);
  const entered = useRef(false);
  const enter = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    sheet.enter(() => setSettled(true));
  }, [sheet]);
  useEffect(() => {
    const off = navigation.addListener('transitionStart', (e) => {
      if (!e.data.closing) enter();
    });
    const fallback = setTimeout(enter, 1000);
    return () => {
      off();
      clearTimeout(fallback);
    };
  }, [navigation, enter]);

  // The try-on comes off when the sheet goes.
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

  // What each card's button said when it was tapped, for the cell that flies with it.
  const ctas = useRef(new Map<LookId, string>());
  const ctaFor = useCallback(
    (look: LookId) =>
      ctas.current.get(look) ?? (look === worn ? t('looks.card.customise') : t('looks.card.tryOn')),
    [worn, t],
  );

  // Out: the card's sky flies to fill the screen while the sheet sinks; then the look goes on.
  const open = useCallback(
    (look: LookId, card: CardRect | null, cta: string, image: SkImage | null) => {
      if (flight || trying) return;
      ctas.current.set(look, cta);
      if (!card) {
        setTrying(look);
        setPanel(look);
        mode.set(withTiming(1, MOVE));
        detailShown.set(withTiming(1, REVEAL));
        return;
      }
      setFlight({ look, hour: shopHour ?? hour, card, cta, way: 'out', image });
    },
    [flight, trying, mode, detailShown, shopHour, hour],
  );

  // Back: the page's sky covers it, the look comes off underneath, then it shrinks into its card.
  const back = useCallback(() => {
    if (trying === null || flight) return;
    const look = trying;
    const index = Math.max(0, SHOP_ORDER.indexOf(look));
    setFocus(index);
    listRef.current?.scrollToOffset({ offset: index * metrics.step, animated: false });
    // Find the card where the shop now has it: measured while the sheet sits low, so its rise
    // is taken back out.
    requestAnimationFrame(() => {
      const handle = cards.current.get(look);
      const lowered = mode.get() * sink + sheet.y.get();
      const fallback: CardRect = {
        x: metrics.side,
        y: shopTop + 120,
        width: metrics.card,
        height: metrics.height,
      };
      const go = (card: CardRect, image: SkImage | null) =>
        setFlight({ look, hour: shopHour ?? hour, card, cta: ctaFor(look), way: 'back', image });
      if (!handle) return go(fallback, null);
      void snapshotOf(handle.canvas).then((image) =>
        handle.frame.measureInWindow((_x, y, w, h) =>
          go(w > 0 ? { x: metrics.side, y: y - lowered, width: w, height: h } : fallback, image),
        ),
      );
    });
  }, [trying, flight, listRef, metrics, mode, sink, sheet.y, shopTop, shopHour, hour, ctaFor]);

  const landedBack = useCallback(() => {
    setFlight(null);
    setFlying(false);
    setPanel(null);
  }, []);

  const finishOut = useCallback(() => {
    setFlight(null);
    setFlying(false);
  }, []);

  backRef.current = back;
  useEffect(() => {
    inTryOn.set(trying !== null && flight === null);
  }, [inTryOn, trying, flight]);

  const takeOff = useCallback(() => setTrying(null), []);

  // Starts a flight once its picture is laid out (its layout changes every frame after). The look
  // changes as the flight starts, so the app re-renders while the picture flies over it and the
  // try-on can show the moment it lands.
  const started = useRef<Flight | null>(null);
  const ready = useCallback(() => {
    if (!flight || started.current === flight) return;
    started.current = flight;
    requestAnimationFrame(() => {
      setFlying(true);
      if (flight.way === 'out') {
        fly.set(0);
        flyOpacity.set(1);
        mode.set(withSpring(1, FLIGHT));
        landing.set(1);
        fly.set(withSpring(1, FLIGHT));
        setTrying(flight.look);
        setPanel(flight.look);
      } else {
        fly.set(1);
        flyOpacity.set(0);
        detailShown.set(withTiming(0, COVER));
        flyOpacity.set(
          withTiming(1, COVER, (finished) => {
            if (!finished) return;
            scheduleOnRN(takeOff);
            // A push to start with, so the shrink sets off at once instead of easing out of rest.
            mode.set(withSpring(0, { ...FLIGHT, velocity: -1.6 }));
            // A sheet pulled down to come back rises with the rest.
            sheet.y.set(withSpring(0, FLIGHT));
            landing.set(-1);
            fly.set(withSpring(0, { ...FLIGHT, velocity: -1.6 }));
          }),
        );
      }
    });
  }, [flight, fly, flyOpacity, mode, detailShown, landing, takeOff, sheet.y]);

  // A flight lands once it is nearly there: out, the sky gives way to the page and the try-on;
  // back, the card takes its place.
  useAnimatedReaction(
    () => fly.get(),
    (p) => {
      const way = landing.get();
      if (way === 1 && p >= LANDING) {
        landing.set(0);
        detailShown.set(withTiming(1, REVEAL));
        flyOpacity.set(
          withTiming(0, REVEAL, (gone) => {
            if (gone) scheduleOnRN(finishOut);
          }),
        );
      } else if (way === -1 && p <= 1 - LANDING) {
        landing.set(0);
        scheduleOnRN(landedBack);
      }
    },
  );

  const step = useCallback(
    (by: 1 | -1) => {
      if (trying === null || flight) return;
      const next = neighbour(trying, by);
      setTrying(next);
      setPanel(next);
      setFocus(SHOP_ORDER.indexOf(next));
    },
    [trying, flight],
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
    opacity: interpolate(mode.get(), [0, 0.6], [1, 0], Extrapolation.CLAMP),
  }));
  const lookStyle = useAnimatedStyle(() => ({ opacity: detailShown.get() }));
  const lookBgStyle = useAnimatedStyle(() => ({ opacity: mode.get() }));

  const grabIn = (on: boolean) => (header: ReactNode) =>
    on ? (
      <GestureDetector gesture={sheet.header}>
        <View collapsable={false}>{header}</View>
      </GestureDetector>
    ) : (
      <View collapsable={false}>{header}</View>
    );

  const inShop = trying === null && flight === null;

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
        onLayout={(e) => sheet.travel.set(Math.max(1, height - e.nativeEvent.layout.y))}
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: shopTop,
            height: height - shopTop,
            borderTopLeftRadius: SHEET_RADIUS,
            borderTopRightRadius: SHEET_RADIUS,
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
          pointerEvents={inShop ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, shopStyle]}
        >
          <LooksShop
            listRef={listRef}
            focus={focus}
            shopHour={shopHour}
            live={inShop}
            settled={settled}
            onFocus={setFocus}
            onJump={jump}
            onShopHour={setShopHour}
            onOpen={open}
            onDone={sheet.dismiss}
            grab={grabIn(trying === null)}
            scroll={shopScroll}
            hidden={flying && flight ? flight.look : null}
            register={register}
          />
        </Animated.View>
        {panel === null ? null : (
          <Animated.View
            pointerEvents={trying !== null && flight === null ? 'auto' : 'none'}
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
              scroll={detailScroll}
            />
          </Animated.View>
        )}
      </Animated.View>

      {flight ? (
        <CardFlight
          key={`${flight.look}-${flight.way}`}
          look={flight.look}
          hour={flight.hour}
          config={config[flight.look]}
          cta={flight.cta}
          copy={copy}
          card={flight.card}
          // Down past the sheet's top so the sky, not the page, shows in its rounded corners.
          to={{ x: 0, y: 0, width, height: lookTop + SHEET_RADIUS }}
          image={flight.image}
          progress={fly}
          opacity={flyOpacity}
          onReady={ready}
        />
      ) : null}
    </View>
  );
}
