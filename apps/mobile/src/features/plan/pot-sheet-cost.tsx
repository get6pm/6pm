import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../../ui/haptics';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { potReflow } from './pot-rows';
import { potSheetColours } from './pot-sheet-colours';

/** What a saved pot costs, as the panel at the foot of its card says it. */
export interface PotCost {
  /** "21,4tr a month" */
  readonly title: string;
  /** On the right: "about 713k a day", or what the month has free when it is too much. */
  readonly aside?: string | undefined;
  /** It fits: how much of what the month has free it takes (0 to 1), and the line saying so. */
  readonly fit?: { readonly share: number; readonly text: string } | undefined;
  /** It is too much: why, and the soonest month that fits. */
  readonly warn?:
    | {
        readonly text: string;
        readonly action?: { readonly label: string; readonly onPress: () => void } | undefined;
      }
    | undefined;
  /** Neither (paused, no date, a goal fed by Future you): one plain line. */
  readonly note?: string | undefined;
}

const FADE_MS = 220;

/** The cost of a pot on its card: a month, a day, a bar of what it takes and whether it fits. */
export function PotCostPanel({ cost, hue }: { readonly cost: PotCost; readonly hue: number }) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const colours = potSheetColours(palette, hue);
  const { fit, warn } = cost;
  const bg = warn ? colours.warnBg : colours.fitBg;
  const share = useSharedValue(fit?.share ?? 0);
  useEffect(() => {
    share.value = withTiming(fit?.share ?? 0, {
      duration: reduceMotion ? 0 : 420,
      easing: easeOut,
    });
  }, [fit?.share, share, reduceMotion]);
  const wash = useAnimatedStyle(() => ({
    backgroundColor: withTiming(bg, { duration: reduceMotion ? 0 : FADE_MS }),
  }));
  const bar = useAnimatedStyle(() => ({ width: `${share.value * 100}%` }));

  return (
    <Animated.View
      layout={potReflow}
      entering={FadeIn.duration(FADE_MS)}
      exiting={FadeOut.duration(140)}
      style={[{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }, wash]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <Text style={{ ...body(15.5, 650), color: palette.ink, flexShrink: 1 }}>{cost.title}</Text>
        {cost.aside ? (
          <Text
            numberOfLines={1}
            style={{ ...body(13), color: warn ? colours.warnInk : palette.inkSoft }}
          >
            {cost.aside}
          </Text>
        ) : null}
      </View>
      {fit ? (
        <Animated.View
          entering={FadeIn.duration(FADE_MS)}
          exiting={FadeOut.duration(140)}
          style={{ gap: 10 }}
        >
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: palette.chipBg,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[{ height: 8, borderRadius: 4, backgroundColor: colours.fitBar }, bar]}
            />
          </View>
          <Text style={{ ...body(12.5), color: colours.fitInk }}>{fit.text}</Text>
        </Animated.View>
      ) : null}
      {warn ? (
        <Animated.View
          entering={FadeIn.duration(FADE_MS)}
          exiting={FadeOut.duration(140)}
          style={{ gap: 10 }}
        >
          <Text style={{ ...body(13), lineHeight: 18.85, color: colours.warnInk }}>
            {warn.text}
          </Text>
          {warn.action ? (
            <PressScale
              accessibilityRole="button"
              onPress={() => {
                haptics.tick();
                warn.action?.onPress();
              }}
              style={{
                alignSelf: 'flex-start',
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 99,
                backgroundColor: palette.btnBg,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(13, 650), color: palette.btnFg }}>{warn.action.label}</Text>
            </PressScale>
          ) : null}
        </Animated.View>
      ) : null}
      {cost.note ? (
        <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>{cost.note}</Text>
      ) : null}
    </Animated.View>
  );
}
