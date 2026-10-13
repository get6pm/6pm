import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { scheduleOnRN } from 'react-native-worklets';

import { Companion } from '../companion/companion';
import { useTheme } from '../theme/theme';
import { body } from '../type/fonts';

/** The resting Dynamic Island the toast grows out of, and the toast it becomes (design points). */
const ISLAND = { top: 11, width: 126, height: 37, radius: 24 };
const TOAST = { inset: 14, height: 80, radius: 40 };
/** Phones with a Dynamic Island have a top safe area of at least this; notched and older ones less. */
const ISLAND_SAFE_TOP = 59;
/** Without an island the pill starts this far below the status bar instead. */
const BELOW_STATUS_BAR = 6;
const SHOW_MS = 3000;
/** The line arrives once the pill is mostly open, and leaves before it closes. */
const lineIn = FadeIn.duration(200).delay(100);
const lineOut = FadeOut.duration(150);

/**
 * Where the pill's top edge sits: on the hardware island where there is one, so the toast grows out
 * of it; elsewhere just under the status bar or notch.
 */
export function islandTop(safeTop: number): number {
  return safeTop >= ISLAND_SAFE_TOP ? ISLAND.top : safeTop + BELOW_STATUS_BAR;
}
/** The prototype's island spring: `all .55s cubic-bezier(.2,.95,.25,1.1)`. */
const morph = { duration: 550, easing: Easing.bezier(0.2, 0.95, 0.25, 1.1) };

const ToastContext = createContext<((text: string, holdMs?: number) => void) | null>(null);

/**
 * The companion's toasts: the Dynamic Island swells into a black pill with the companion and its
 * line, holds for three seconds, then shrinks back into the island. It draws in a window above
 * every sheet, so a line said from inside a sheet is still seen.
 */
export function ToastHost({ children }: { readonly children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((line: string, holdMs = SHOW_MS) => {
    clearTimeout(timer.current);
    setText(line);
    AccessibilityInfo.announceForAccessibility(line);
    timer.current = setTimeout(() => setText(null), holdMs);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext value={show}>
      {children}
      <Island text={text} onDismiss={() => setText(null)} />
    </ToastContext>
  );
}

function Island({
  text,
  onDismiss,
}: {
  readonly text: string | null;
  readonly onDismiss: () => void;
}) {
  const { serious } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const open = useSharedValue(0);
  // The last line stays drawn while the island shrinks back, then the pill is removed.
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (text !== null) {
      setShown(text);
      open.set(withTiming(1, morph));
    } else {
      open.set(
        withTiming(0, morph, (done) => {
          if (done) scheduleOnRN(setShown, null);
        }),
      );
    }
  }, [open, text]);

  const top = islandTop(insets.top);
  const full = width - TOAST.inset * 2;
  const pill = useAnimatedStyle(() => {
    const t = open.get();
    return {
      width: ISLAND.width + (full - ISLAND.width) * t,
      height: ISLAND.height + (TOAST.height - ISLAND.height) * t,
      borderRadius: ISLAND.radius + (TOAST.radius - ISLAND.radius) * t,
    };
  });
  // The shadow lives on its own view and only fades: it should not ring the hardware island at rest.
  const shadow = useAnimatedStyle(() => ({ opacity: Math.min(1, open.get()) }));

  if (shown === null) return null;
  // Mounted only while a line shows: its own window sits above every sheet.
  return (
    <FullWindowOverlay>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center' }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              backgroundColor: '#000',
              boxShadow: '0 14px 40px rgba(0,0,0,.35)',
            },
            pill,
            shadow,
          ]}
        />
        <Animated.View style={[{ backgroundColor: '#000', overflow: 'hidden' }, pill]}>
          <Pressable accessibilityRole="alert" onPress={onDismiss} style={{ flex: 1 }}>
            {text !== null ? (
              <Animated.View
                key={shown}
                entering={lineIn}
                exiting={lineOut}
                style={{
                  width: full,
                  height: TOAST.height,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 12,
                  paddingLeft: 14,
                  paddingRight: 22,
                  paddingBottom: 6,
                }}
              >
                {/* Serious mode removes the companion; its words stay. */}
                {!serious ? <Companion size={48} mood="happy" /> : null}
                {/* Below the camera cutout, which would cover a line drawn through the middle. */}
                <View
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    justifyContent: 'center',
                    paddingTop: ISLAND.height - 6,
                  }}
                >
                  <Text
                    numberOfLines={2}
                    style={{ ...body(15, 550, -0.01), lineHeight: 19.5, color: '#fff' }}
                  >
                    {shown}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </Pressable>
        </Animated.View>
      </View>
    </FullWindowOverlay>
  );
}

/** Shows a companion line in the island for three seconds; a new line replaces the last. */
export function useToast() {
  const show = use(ToastContext);
  if (!show) throw new Error('useToast needs a ToastHost above it');
  return show;
}
