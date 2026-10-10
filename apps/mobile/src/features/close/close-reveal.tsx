import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Companion } from '../../ui/companion/companion';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { haptics } from '../../ui/haptics';
import { Odometer } from '../../ui/odometer';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono } from '../../ui/type/fonts';

/** The pause before tomorrow's number rolls in, so the eye lands on today's first. */
const ROLL_AFTER_MS = 700;

/**
 * Tomorrow: the number rolls from what was left today to tomorrow's line, the month's closed days
 * fill in with today popping in last, and the companion says something about it.
 */
export function CloseReveal(props: {
  readonly kicker: string;
  readonly from: number;
  readonly to: number;
  readonly line: string | null;
  readonly mood: CompanionMood;
  readonly sub: string;
  readonly month: string;
  readonly monthDays: readonly ('closed' | 'today' | 'open')[];
  readonly streak: string;
  readonly nudge: string;
  readonly doneLabel: string;
  readonly onDone: () => void;
}) {
  const { palette, serious } = useTheme();
  const [value, setValue] = useState(props.from);
  useEffect(() => {
    const timer = setTimeout(() => {
      setValue(props.to);
      haptics.success();
    }, ROLL_AFTER_MS);
    return () => clearTimeout(timer);
  }, [props.to]);

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={{ flex: 1, alignItems: 'center', gap: 12 }}
    >
      {!serious ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            width: 420,
            height: 420,
            marginLeft: -210,
            marginTop: -210,
            borderRadius: 210,
            experimental_backgroundImage: `radial-gradient(circle, ${palette.accent}55 0%, ${palette.accent}00 65%)`,
          }}
        />
      ) : null}
      <View style={{ flex: 1 }} />
      {props.line !== null ? <Companion size={112} mood={props.mood} /> : null}
      <Text style={{ ...mono(11, 400, 0.16), color: palette.inkSoft }}>{props.kicker}</Text>
      <Odometer value={value} size={96} weight={500} letterSpacingEm={-0.02} color={palette.ink} />
      {props.line !== null ? (
        <Text
          style={{
            ...display(25),
            lineHeight: 30,
            maxWidth: 310,
            textAlign: 'center',
            marginTop: 6,
            color: palette.ink,
          }}
        >
          {props.line}
        </Text>
      ) : null}
      <Text style={{ ...mono(12, 400, 0.04), color: palette.inkSoft }}>{props.sub}</Text>
      <View style={{ alignItems: 'center', gap: 12, marginTop: 22 }}>
        <Text style={{ ...mono(10.5, 400, 0.16), color: palette.inkSoft }}>{props.month}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 16 * 10 + 15 * 6, gap: 6 }}>
          {props.monthDays.map((d, i) =>
            d === 'today' ? (
              <Animated.View
                key={i}
                entering={ZoomIn.delay(900).springify().damping(10)}
                style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent }}
              />
            ) : (
              <View
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: d === 'closed' ? palette.accent : 'transparent',
                  borderWidth: d === 'closed' ? 0 : 1.5,
                  borderColor: palette.hair,
                }}
              />
            ),
          )}
        </View>
        <View style={{ alignItems: 'center', gap: 3 }}>
          <Text style={{ ...body(15, 650), color: palette.ink }}>{props.streak}</Text>
          <Text style={{ ...body(13.5), color: palette.inkSoft }}>{props.nudge}</Text>
        </View>
      </View>
      <View style={{ flex: 1.3 }} />
      <PressScale
        scaleTo={0.97}
        onPress={props.onDone}
        style={{
          alignSelf: 'stretch',
          height: 56,
          borderRadius: 99,
          backgroundColor: palette.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(17, 650), color: palette.btnFg }}>{props.doneLabel}</Text>
      </PressScale>
    </Animated.View>
  );
}
