import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { scanColours as c } from './scan-colours';
import { ScanOutline } from './scan-outline';

/** The prototype's frame: 240 pt square, 152 pt below the close button's row. */
export const FRAME = 240;
export const FRAME_BELOW_BAR = 152;
/** The hint sits 24 pt under the frame. */
const HINT_BELOW_FRAME = 24;
const SHUTTER = 76;
/** CSS `ease-in-out`, which the prototype's `scanline 2.2s` uses for each half of the sweep. */
const sweepEase = Easing.bezier(0.42, 0, 0.58, 1);
const settle = { duration: 220, easing: Easing.bezier(0.2, 0.9, 0.2, 1) };

/** What the camera sees: a QR code, a receipt, or nothing yet. */
export type Seeing = 'code' | 'receipt' | null;

/** The accent line sweeping the frame from 8% to 88% and back while 6pm looks for a code. */
function ScanLine({ top }: { readonly top: number }) {
  const { palette } = useTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? 0.5 : 0);
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: 1100, easing: sweepEase }), -1, true);
    return () => cancelAnimation(t);
  }, [reduce, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: FRAME * (0.08 + 0.8 * t.value) }],
  }));
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top,
          alignSelf: 'center',
          width: FRAME - 36,
          height: 1.5,
          backgroundColor: palette.accent,
          boxShadow: `0 0 20px 4px ${c.scanGlow}`,
        },
        style,
      ]}
    />
  );
}

/** A round glass button over the camera; `on` fills it, for the light. */
function GlassButton({
  icon,
  label,
  onPress,
  on = false,
  size = 44,
}: {
  readonly icon: SymbolName;
  readonly label: string;
  readonly onPress: () => void;
  readonly on?: boolean;
  readonly size?: number;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      hitSlop={6}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 0.5,
        borderColor: c.glassBorder,
        backgroundColor: on ? c.onGlass : c.glass,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={size > 44 ? 24 : 22} color={on ? c.cardInk : c.onGlass} />
    </PressScale>
  );
}

/** One half of the mode pill: lit while the camera sees that kind of thing. */
function ModeSegment({
  icon,
  label,
  lit,
}: {
  readonly icon: SymbolName;
  readonly label: string;
  readonly lit: boolean;
}) {
  const on = useSharedValue(lit ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(lit ? 1 : 0, settle);
  }, [lit, on]);
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0)', c.onGlass]),
  }));
  return (
    <Animated.View
      style={[
        {
          height: 30,
          paddingHorizontal: 11,
          borderRadius: 99,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        },
        fill,
      ]}
    >
      <Symbol name={icon} size={16} color={lit ? c.cardInk : c.onGlass} />
      <Text style={{ ...body(13, 600), color: lit ? c.cardInk : c.text }}>{label}</Text>
    </Animated.View>
  );
}

/** The shutter: a white disc in a ring that fills with the accent as a receipt is held still. */
function Shutter({
  label,
  steady,
  enabled,
  onPress,
}: {
  readonly label: string;
  readonly steady: SharedValue<number>;
  readonly enabled: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const ring = Skia.Path.Make();
  ring.addCircle(SHUTTER / 2, SHUTTER / 2, SHUTTER / 2 - 2);
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={{
        width: SHUTTER,
        height: SHUTTER,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enabled ? 1 : 0.4,
      }}
    >
      <View
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: SHUTTER / 2,
          borderWidth: 4,
          borderColor: c.onGlass,
        }}
      />
      <Canvas
        pointerEvents="none"
        style={{ position: 'absolute', inset: 0, transform: [{ rotate: '-90deg' }] }}
      >
        <Path
          path={ring}
          color={palette.accent}
          style="stroke"
          strokeWidth={4}
          strokeCap="round"
          start={0}
          end={steady}
        />
      </Canvas>
      <View
        style={{
          width: SHUTTER - 16,
          height: SHUTTER - 16,
          borderRadius: (SHUTTER - 16) / 2,
          backgroundColor: c.onGlass,
        }}
      />
    </PressScale>
  );
}

export interface ViewfinderLabels {
  readonly close: string;
  readonly qr: string;
  readonly receipt: string;
  readonly light: string;
  readonly photos: string;
  readonly shutter: string;
  readonly type: string;
}

/**
 * Everything drawn over the live camera. On top, the way out, what Scan reads (a QR code or a
 * receipt, lit as the camera sees one) and the light. In the middle, the frame whose corners
 * close onto a receipt, the line that sweeps it while looking for a code, and the hint, with the
 * VietQR network named under it where the money is đồng. Below, a photo from the library, the
 * shutter for a receipt, and typing it instead.
 */
export function ScanViewfinder({
  top,
  bottom,
  looking,
  seeing,
  hint,
  caption,
  labels,
  quad,
  seen,
  steady,
  torch,
  canShoot,
  onClose,
  onTorch,
  onPhotos,
  onShutter,
  onType,
  grabber,
  frame,
}: {
  /** The close button's row, from the top of the view. */
  readonly top: number;
  /** Room kept under the controls: the home indicator's inset. */
  readonly bottom: number;
  readonly looking: boolean;
  readonly seeing: Seeing;
  readonly hint: string;
  /** Under the hint: the payment network, in Vietnam only. */
  readonly caption: string | null;
  readonly labels: ViewfinderLabels;
  readonly quad: SharedValue<number[]>;
  readonly seen: SharedValue<number>;
  readonly steady: SharedValue<number>;
  readonly torch: boolean;
  readonly canShoot: boolean;
  readonly onClose: () => void;
  /** Null when this camera has no light (the front one). */
  readonly onTorch: (() => void) | null;
  readonly onPhotos: () => void;
  readonly onShutter: () => void;
  readonly onType: () => void;
  /** Draws the sheet's grabber above the row. */
  readonly grabber: boolean;
  /** The frame is drawn while looking and reading, not under a card. */
  readonly frame: boolean;
}) {
  const { palette } = useTheme();
  const frameTop = top + FRAME_BELOW_BAR;
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      {frame ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          <ScanOutline quad={quad} seen={seen} steady={steady} accent={palette.accent} />
        </Animated.View>
      ) : null}
      {looking && seeing !== 'receipt' ? <ScanLine top={frameTop} /> : null}
      {grabber ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 6,
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 9,
            backgroundColor: c.onGlass,
            opacity: 0.35,
          }}
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          top,
          left: 18,
          right: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <GlassButton icon="close" label={labels.close} onPress={onClose} />
        <View
          accessibilityRole="text"
          style={{
            height: 36,
            padding: 3,
            borderRadius: 99,
            backgroundColor: c.glass,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ModeSegment icon="qr_code_2" label={labels.qr} lit={seeing === 'code'} />
          <ModeSegment icon="receipt_long" label={labels.receipt} lit={seeing === 'receipt'} />
        </View>
        {onTorch ? (
          <GlassButton icon="flashlight_on" label={labels.light} on={torch} onPress={onTorch} />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: frameTop + FRAME + HINT_BELOW_FRAME,
          left: 0,
          right: 0,
        }}
      >
        <Text
          accessibilityLiveRegion="polite"
          style={{ textAlign: 'center', ...body(15), color: c.hint }}
        >
          {hint}
        </Text>
        {caption ? (
          <Text style={{ marginTop: 6, textAlign: 'center', ...body(12, 600), color: c.sub }}>
            {caption}
          </Text>
        ) : null}
      </View>
      {looking ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={{
            position: 'absolute',
            bottom: bottom + 28,
            left: 40,
            right: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <GlassButton icon="image" label={labels.photos} onPress={onPhotos} size={52} />
          <Shutter label={labels.shutter} steady={steady} enabled={canShoot} onPress={onShutter} />
          <GlassButton icon="keyboard" label={labels.type} onPress={onType} size={52} />
        </Animated.View>
      ) : null}
    </View>
  );
}
