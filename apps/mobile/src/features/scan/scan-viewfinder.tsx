import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useDesignInsets } from '../../ui/layout/design-insets';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { scanColours as c } from './scan-colours';

const FRAME = 240;
const CORNER = 46;
const STROKE = 3.5;
/** CSS `ease-in-out`, which the prototype's `scanline 2.2s` uses for each half of the sweep. */
const sweepEase = Easing.bezier(0.42, 0, 0.58, 1);

const corners = [
  { left: 0, top: 0, borderLeftWidth: STROKE, borderTopWidth: STROKE, borderTopLeftRadius: 26 },
  { right: 0, top: 0, borderRightWidth: STROKE, borderTopWidth: STROKE, borderTopRightRadius: 26 },
  {
    left: 0,
    bottom: 0,
    borderLeftWidth: STROKE,
    borderBottomWidth: STROKE,
    borderBottomLeftRadius: 26,
  },
  {
    right: 0,
    bottom: 0,
    borderRightWidth: STROKE,
    borderBottomWidth: STROKE,
    borderBottomRightRadius: 26,
  },
] as const;

/** The accent line sweeping the frame from 8% to 88% and back while 6pm looks for a code. */
function ScanLine() {
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
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 18,
          right: 18,
          height: 1.5,
          backgroundColor: palette.accent,
          boxShadow: `0 0 20px 4px ${c.scanGlow}`,
        },
        style,
      ]}
    />
  );
}

/**
 * Everything drawn over the live camera: the close button and the VietQR badge, the frame with its
 * four corners, the line that sweeps it while looking, and the hint under it.
 */
export function ScanViewfinder({
  looking,
  hint,
  closeLabel,
  badge,
  onClose,
  typeInstead,
}: {
  readonly looking: boolean;
  readonly hint: string;
  readonly closeLabel: string;
  readonly badge: string;
  readonly onClose: () => void;
  /** "Type it instead", shown while looking. */
  readonly typeInstead: { readonly label: string; readonly onPress: () => void } | null;
}) {
  const { top } = useDesignInsets();
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      <View
        style={{
          position: 'absolute',
          top: top(60),
          left: 18,
          right: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          hitSlop={6}
          onPress={onClose}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 0.5,
            borderColor: c.glassBorder,
            backgroundColor: c.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="close" size={22} color={c.onGlass} />
        </PressScale>
        <View
          style={{
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 99,
            backgroundColor: c.glass,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(14, 600), color: c.text }}>{badge}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: top(212),
          alignSelf: 'center',
          width: FRAME,
          height: FRAME,
        }}
        pointerEvents="none"
      >
        {corners.map((corner, i) => (
          <View
            key={i}
            style={[
              { position: 'absolute', width: CORNER, height: CORNER, borderColor: c.frame },
              corner,
            ]}
          />
        ))}
        {looking ? <ScanLine /> : null}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{
          position: 'absolute',
          top: top(476),
          left: 0,
          right: 0,
          textAlign: 'center',
          ...body(15),
          color: c.hint,
        }}
      >
        {hint}
      </Text>
      {typeInstead ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={{ position: 'absolute', top: top(640), alignSelf: 'center' }}
        >
          <PressScale
            accessibilityRole="button"
            onPress={typeInstead.onPress}
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: 99,
              backgroundColor: c.typeButton,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Symbol name="keyboard" size={20} color={c.onGlass} />
            <Text style={{ ...body(15, 600), color: c.onGlass }}>{typeInstead.label}</Text>
          </PressScale>
        </Animated.View>
      ) : null}
    </View>
  );
}
