import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { clockOf } from '@6pm/domain';
import { paletteFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const KNOB = 30;
const TRACK = 36;
/** The day the slider spans: 6 am to midnight. */
const FROM = 6;
const SPAN = 18;
/** Within this of now, the knob is back at now. */
const NOW_SNAP = 0.2;
/** The hours the track's colours are read at, as the prototype samples them. */
const STOPS = [6, 8, 10, 12, 14, 16, 17.5, 18.5, 19.5, 21, 24];
/** From here the knob is the moon. */
const NIGHT = 18.6;

const clampHour = (hour: number) => Math.min(FROM + SPAN, Math.max(FROM, hour));
const share = (hour: number) => (clampHour(hour) - FROM) / SPAN;

/**
 * "Time of day" (prototype `App:912-926`): a track coloured by the look in front through the day,
 * a line at now, and a sun (a moon after dark) the finger drags to see every look at another
 * hour. It reports quarter hours; back near now it lets go and the shop follows the clock again.
 */
export function DaySlider({
  look,
  config,
  now,
  hour,
  onHour,
}: {
  /** The look in front, whose colours the track wears. */
  readonly look: LookId;
  readonly config: Partial<LookConfig> | undefined;
  readonly now: number;
  /** The hour the shop is showing; null while it follows the clock. */
  readonly hour: number | null;
  readonly onHour: (hour: number | null) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const shown = hour ?? now;
  const night = shown >= NIGHT;

  const track = useMemo(() => {
    const stops = STOPS.map((h) => {
      const at = ((h - FROM) / SPAN) * 100;
      const { st } = paletteFor({ look, hour: h, serious: false, config: config ?? {} });
      return `${st[1]} ${at.toFixed(1)}%`;
    });
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }, [look, config]);

  const width = useSharedValue(0);
  const knob = useSharedValue(share(shown));
  const nowAt = useSharedValue(share(now));
  const sent = useSharedValue<number>(hour ?? -1);
  const dragging = useSharedValue(false);

  useEffect(() => nowAt.set(share(now)), [now, nowAt]);
  // From outside (Back to now, or a minute passing): glide there unless a finger holds it.
  useEffect(() => {
    sent.set(hour ?? -1);
    if (!dragging.get()) {
      knob.set(
        withTiming(share(hour ?? now), {
          duration: 300,
          easing: easeOut,
          reduceMotion: ReduceMotion.System,
        }),
      );
    }
  }, [hour, now, knob, sent, dragging]);

  const report = useRef(onHour);
  report.current = onHour;
  const changed = useCallback((next: number) => report.current(next < 0 ? null : next), []);

  const gesture = useMemo(() => {
    const apply = (x: number) => {
      'worklet';
      const room = Math.max(1, width.get() - KNOB);
      const u = Math.min(1, Math.max(0, (x - KNOB / 2) / room));
      knob.set(u);
      const h = Math.round((FROM + u * SPAN) * 4) / 4;
      const next = Math.abs(h - (FROM + nowAt.get() * SPAN)) < NOW_SNAP ? -1 : h;
      if (next !== sent.get()) {
        sent.set(next);
        scheduleOnRN(changed, next);
      }
    };
    const settle = () => {
      'worklet';
      dragging.set(false);
      const h = sent.get();
      const u = h < 0 ? nowAt.get() : (h - FROM) / SPAN;
      knob.set(
        withTiming(u, { duration: 200, easing: easeOut, reduceMotion: ReduceMotion.System }),
      );
      scheduleOnRN(haptics.tick);
    };
    // Sideways only once the finger has clearly gone sideways, so a scroll that starts here scrolls.
    const pan = Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-10, 10])
      .onStart((e) => {
        dragging.set(true);
        apply(e.x);
      })
      .onUpdate((e) => apply(e.x))
      .onFinalize(settle);
    const tap = Gesture.Tap().onEnd((e, success) => {
      if (!success) return;
      apply(e.x);
      settle();
    });
    return Gesture.Exclusive(pan, tap);
  }, [width, knob, nowAt, sent, dragging, changed]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knob.get() * Math.max(0, width.get() - KNOB) }],
  }));
  const nowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: KNOB / 2 - 1 + nowAt.get() * Math.max(0, width.get() - KNOB) }],
  }));

  const scrubbed = hour !== null;
  const label = scrubbed ? clockOf(shown) : t('looks.day.now', { time: clockOf(shown) });
  const marks = [
    { key: 'dawn', text: t('looks.day.dawn'), at: 0 },
    { key: 'noon', text: t('looks.day.noon'), at: 1 / 3 },
    { key: 'dusk', text: t('looks.day.dusk'), at: 2 / 3 },
    { key: 'midnight', text: t('looks.day.midnight'), at: 1 },
  ];

  return (
    <View
      style={{
        marginHorizontal: 22,
        paddingTop: 14,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderRadius: 22,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        gap: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ gap: 1, flexShrink: 1 }}>
          <Text style={{ ...body(14.5, 650), color: palette.ink }}>{t('looks.day.title')}</Text>
          <Text style={{ ...body(12), color: palette.inkSoft }}>{t('looks.day.sub')}</Text>
        </View>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={scrubbed ? t('looks.day.backToNow') : label}
          disabled={!scrubbed}
          scaleTo={0.95}
          onPress={() => {
            haptics.tick();
            onHour(null);
          }}
          style={{
            height: 30,
            paddingHorizontal: 11,
            borderRadius: 99,
            backgroundColor: scrubbed ? palette.btnBg : 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text
            style={{
              ...body(13, 650),
              fontVariant: ['tabular-nums'],
              color: scrubbed ? palette.btnFg : palette.ink,
            }}
          >
            {label}
          </Text>
          {scrubbed ? <Symbol name="undo" size={15} color={palette.btnFg} /> : null}
        </PressScale>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t('looks.day.title')}
          accessibilityValue={{ text: label }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            const step = e.nativeEvent.actionName === 'increment' ? 1 : -1;
            onHour(clampHour(Math.round(shown) + step));
          }}
          onLayout={(e) => width.set(e.nativeEvent.layout.width)}
          style={{ height: TRACK, justifyContent: 'center' }}
        >
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: 99,
              backgroundImage: track,
              boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.14)',
            }}
          />
          {[1 / 3, 2 / 3].map((at) => (
            <View
              key={at}
              style={{
                position: 'absolute',
                left: `${at * 100}%`,
                top: 12,
                width: 1,
                height: 12,
                backgroundColor: 'rgba(255,255,255,.4)',
              }}
            />
          ))}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: -4,
                width: 2,
                height: 44,
                borderRadius: 1,
                backgroundColor: palette.ink,
                opacity: 0.5,
              },
              nowStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: KNOB,
                height: KNOB,
                borderRadius: KNOB / 2,
                backgroundImage: night
                  ? 'radial-gradient(circle at 36% 30%, #ffffff 0%, #d4d8de 42%, #8a909a 100%)'
                  : 'radial-gradient(circle at 50% 38%, #fff4dc 0%, #ffc46b 55%, #ff8552 100%)',
                boxShadow: night
                  ? '0 0 0 3px rgba(255,255,255,.25), 0 2px 10px rgba(0,0,0,.35)'
                  : '0 0 0 3px rgba(255,210,122,.35), 0 0 18px 4px rgba(255,170,80,.45)',
              },
              knobStyle,
            ]}
          />
        </View>
      </GestureDetector>

      <View style={{ height: 14 }}>
        {marks.map(({ key, text, at }) => (
          <Text
            key={key}
            style={{
              ...body(11, 600),
              position: 'absolute',
              color: palette.inkSoft,
              fontVariant: ['tabular-nums'],
              ...(at === 0
                ? { left: 0 }
                : at === 1
                  ? { right: 0 }
                  : { left: `${at * 100}%`, transform: [{ translateX: '-50%' }] }),
            }}
          >
            {text}
          </Text>
        ))}
      </View>
    </View>
  );
}
