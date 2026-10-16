import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, type AnimatedRef } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useHomePageShown } from '../home/home-page';
import { useHomePageScroll, useHomeScroll } from '../home/home-scroll';
import { useEntitlement } from '../purchases/purchases-provider';
import { YearBooks } from '../year-book/year-book-card';
import { AskEntry } from './ask-entry';
import { DayReceipt } from './day-receipt';
import { MoneyDiaries } from './money-diaries';
import { MonthCalendar } from './month-calendar';
import { ScrollReveal } from './scroll-reveal';
import { useDiary } from './use-diary';
import { WeekRecapCard } from './week-recap-card';
import { useDiaryBridge } from '../duo/diary-bridge';
import { useOpenAsk } from '../duo/spread-pane';

/**
 * Diary: the week recap, the month's calendar of receipts, the selected day's receipt, the way
 * into Ask 6pm and the shelf of money diaries. The title fades and drifts as the page scrolls.
 */
export function DiaryPage({ scrollRef }: { readonly scrollRef: AnimatedRef<Animated.ScrollView> }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const { top, bottom } = useDesignInsets();
  const onScroll = useHomePageScroll('diary');
  const shown = useHomePageShown();
  const { y } = useHomeScroll();
  const diary = useDiary();
  const openAsk = useOpenAsk();
  // On the opened iPhone Duo the chosen day is written on the right page, not under the calendar.
  const toPage = useDiaryBridge();
  const closed = diary.cells.flatMap((c) => (c.kind === 'closed' ? [c.day] : []));
  const at = diary.selected === null ? -1 : closed.indexOf(diary.selected);
  const before = at > 0 ? closed[at - 1] : undefined;
  const after = at >= 0 ? closed[at + 1] : undefined;
  const { receipt, select } = diary;
  useEffect(() => {
    if (!toPage) return;
    toPage(
      receipt
        ? {
            receipt,
            onPrevious: before ? () => select(before) : null,
            onNext: after ? () => select(after) : null,
          }
        : null,
    );
  }, [toPage, receipt, before, after, select]);
  useEffect(() => () => toPage?.(null), [toPage]);
  const { max } = useEntitlement();
  const header = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - y.value / 70)),
    transform: [{ translateY: Math.min(y.value, 80) * 0.3 }],
  }));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollsToTop={shown}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: top(64),
        paddingHorizontal: 16,
        paddingBottom: bottom(124),
        gap: 26,
      }}
    >
      <Animated.View style={[{ paddingHorizontal: 6, gap: 2 }, header]}>
        <Text
          style={{
            ...body(13, 600, 0.06),
            textTransform: 'uppercase',
            color: palette.inkSoft,
          }}
        >
          {diary.kicker}
        </Text>
        <Text style={{ ...body(34, 700, -0.03), color: palette.ink }}>{t('diary.title')}</Text>
      </Animated.View>

      <WeekRecapCard recap={diary.recap} kicker={diary.recapKicker} letters={diary.letters} />

      <ScrollReveal>
        <MonthCalendar
          title={diary.monthTitle}
          summary={diary.summary}
          letters={diary.letters}
          cells={diary.cells}
          selected={diary.selected}
          onSelect={diary.select}
          onToday={() => router.push('/close')}
          onMissed={(day) => router.push(`/missed-day?day=${day}` as Href)}
          canPrevious={diary.canPrevious}
          canNext={diary.canNext}
          onPage={diary.page}
        />
      </ScrollReveal>

      {diary.receipt && !toPage ? <DayReceipt receipt={diary.receipt} /> : null}

      <ScrollReveal>
        {/* Ask 6pm has no screen yet: the entry is drawn and does nothing until it lands. */}
        <AskEntry onAsk={openAsk} />
      </ScrollReveal>

      <ScrollReveal>
        <MoneyDiaries
          shelf={diary.shelf}
          onOpen={(month) => router.push(`/money-diary?month=${month}` as Href)}
          yearBooks={<YearBooks books={diary.yearBooks} locked={!max} />}
        />
      </ScrollReveal>
    </Animated.ScrollView>
  );
}
