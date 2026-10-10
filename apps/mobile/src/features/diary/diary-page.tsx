import { Text, View } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';
import { useHomePageScroll } from '../home/home-scroll';

/** Diary: the week recap, the calendar of closed days and the money diaries. */
export function DiaryPage({ scrollRef }: { readonly scrollRef: AnimatedRef<Animated.ScrollView> }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { top } = useDesignInsets();
  const onScroll = useHomePageScroll('diary');
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
        <Text style={{ ...display(30, 500, -0.02), color: palette.ink }}>{t('tabs.diary')}</Text>
      </View>
    </Animated.ScrollView>
  );
}
