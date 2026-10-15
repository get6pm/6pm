import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { type DailyNumber } from '@6pm/domain';

import type { PlanSettings } from '../../data/plan-settings';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { Companion } from '../../ui/companion/companion';
import { companionMood } from '../../ui/companion/companion-mood';
import { PressScale } from '../../ui/primitives/press-scale';
import { useCompanionLine } from '../wording/use-companion-line';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';

type HomeEvent = 'idle' | 'closedIdle' | 'late' | 'replan' | 'paused';

/**
 * The companion on the lip of Today's sheet with its speech bubble. Hidden in serious mode: no
 * companion, no jokes. On a calm or closed day the line is about the user's own days (a fact the
 * companion picked, worded by a model or the catalogue); late, re-planned and paused keep theirs.
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
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { hour } = useClock();
  // A calm day says something about the user's own days; the other events keep their lines.
  const own = useCompanionLine(event === 'closedIdle' ? 'close' : 'today', 'bubble', {
    enabled: !serious && (event === 'idle' || event === 'closedIdle'),
  });
  if (serious) return null;
  const mood = companionMood({
    hour,
    serious,
    safe: day.safe,
    toast: false,
    closed: event === 'closedIdle',
  });
  const line =
    own?.text ??
    t(`companion.${event}.${plan.persona}` as 'companion.replan.cheeky', {
      t: money.short(day.tomorrow),
      b: money.short(day.line),
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
      {own === undefined ? null : (
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
      )}
    </View>
  );
}
