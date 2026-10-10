import { Text, View } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';
import { useHomePageScroll } from '../home/home-scroll';

/** Plan: the month's money river, the daily number, bills, Future you and occasions. */
export function PlanPage({ scrollRef }: { readonly scrollRef: AnimatedRef<Animated.ScrollView> }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { top } = useDesignInsets();
  const onScroll = useHomePageScroll('plan');
  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: top(70), paddingHorizontal: 20, paddingBottom: 140 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ ...display(30, 500, -0.02), color: palette.ink }}>{t('tabs.plan')}</Text>
      </View>
    </Animated.ScrollView>
  );
}
