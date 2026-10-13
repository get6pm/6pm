import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatShort, type DailyNumber } from '@6pm/domain';

import type { PlanSettings } from '../../data/plan-settings';
import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { companionMood } from '../../ui/companion/companion-mood';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';

type HomeEvent = 'idle' | 'closedIdle' | 'late' | 'replan' | 'paused';

/**
 * The companion on the lip of Today's sheet with its speech bubble. Hidden in serious mode: no
 * companion, no jokes. The line follows the day (calm, closed, late, or re-planned after a big day).
 */
export function CompanionGreeting({
  day,
  plan,
  event,
  onPress,
}: {
  readonly day: DailyNumber;
  readonly plan: PlanSettings;
  readonly event: HomeEvent;
  readonly onPress: () => void;
}) {
  const { palette, serious } = useTheme();
  const { t, language } = useI18n();
  const { hour } = useClock();
  if (serious) return null;
  const mood = companionMood({
    hour,
    serious,
    safe: day.safe,
    toast: false,
    closed: event === 'closedIdle',
  });
  const line = t(`companion.${event}.${plan.persona}` as 'companion.replan.cheeky', {
    t: formatShort(day.tomorrow, language),
    b: formatShort(day.line, language),
  });
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 20,
        left: 18,
        right: 18,
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      <PressScale onPress={onPress} accessibilityRole="button">
        <Companion size={62} mood={mood} />
      </PressScale>
      <Animated.View entering={FadeInDown.delay(150).duration(500).springify().damping(18)}>
        <PressScale
          inScroll
          onPress={onPress}
          style={{
            marginBottom: 24,
            maxWidth: 286,
            paddingTop: 10,
            paddingHorizontal: 15,
            paddingBottom: 11,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 6,
            backgroundColor: palette.bubbleBg,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), 0 10px 24px rgba(20,8,30,.22)',
          }}
        >
          <Text
            style={{ ...display(16.5, 500, -0.005), lineHeight: 20.6, color: palette.bubbleFg }}
          >
            {line}
          </Text>
        </PressScale>
      </Animated.View>
    </View>
  );
}
