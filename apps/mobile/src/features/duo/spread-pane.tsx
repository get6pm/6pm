import { useRouter } from 'expo-router';
import { createContext, memo, use, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  ReduceMotion,
  SlideInRight,
} from 'react-native-reanimated';

import { monthOf, type DailyNumber } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { AskScreen } from '../ask/ask-screen';
import { SpendDetails } from '../details/spend-details';
import { useDiaryDates } from '../diary/diary-dates';
import { MonthPane } from './month-pane';

/** What the right page shows beside Today: the month, the spend just tapped, or Ask 6pm. */
export type PaneView =
  | { readonly kind: 'month' }
  | { readonly kind: 'spend'; readonly id: string }
  | { readonly kind: 'ask'; readonly question: string | null; readonly opened: number };

const OpenSpendContext = createContext<((id: string) => void) | null>(null);
export const OpenSpendProvider = OpenSpendContext.Provider;

/**
 * Opens a spend: on the right page when the iPhone Duo is opened beside Today, in the spend sheet
 * everywhere else.
 */
export function useOpenSpend(): (id: string) => void {
  const router = useRouter();
  const onPage = use(OpenSpendContext);
  return useCallback(
    (id: string) => (onPage ? onPage(id) : router.push(`/spend/${id}`)),
    [onPage, router],
  );
}

const OpenAskContext = createContext<((question: string | null) => void) | null>(null);
export const OpenAskProvider = OpenAskContext.Provider;

/**
 * Opens Ask 6pm, with a question to send or none: beside the day on the opened iPhone Duo's right
 * page, in its sheet everywhere else.
 */
export function useOpenAsk(): (question?: string) => void {
  const router = useRouter();
  const onPage = use(OpenAskContext);
  return useCallback(
    (question?: string) => {
      if (onPage) onPage(question ?? null);
      else
        router.push(
          question === undefined ? '/ask' : { pathname: '/ask', params: { q: question } },
        );
    },
    [onPage, router],
  );
}

const pageIn = FadeInDown.duration(300).reduceMotion(ReduceMotion.System);
const monthIn = FadeIn.duration(300).reduceMotion(ReduceMotion.System);
/** Ask slides in from the right edge, as the design's side panel does. */
const askIn = SlideInRight.duration(500)
  .easing(Easing.bezier(0.2, 0.9, 0.2, 1))
  .reduceMotion(ReduceMotion.System);
const pageOut = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

/**
 * The right page: the month, or a spend's details under a back pill named for the month. A tapped
 * spend rises in as the design's detail page does; going back fades the month in.
 */
export const SpreadPane = memo(function SpreadPane({
  day,
  view,
  onBack,
  onAfford,
}: {
  readonly day: DailyNumber;
  readonly view: PaneView;
  readonly onBack: () => void;
  /** What Ask's latest "can I afford" question was for, for the left page's preview. */
  readonly onAfford: (amount: number | null) => void;
}) {
  const { palette } = useTheme();
  const snap = useMoney();
  const dates = useDiaryDates();

  if (view.kind === 'ask') {
    return (
      <Animated.View
        key={`ask-${view.opened}`}
        entering={askIn}
        exiting={pageOut}
        style={{
          flex: 1,
          borderRadius: 32,
          boxShadow: '0 20px 50px rgba(10,4,20,.35)',
          overflow: 'hidden',
        }}
      >
        <AskScreen question={view.question} onClose={onBack} onAfford={onAfford} />
      </Animated.View>
    );
  }

  if (view.kind === 'month') {
    return (
      <Animated.View key="month" entering={monthIn} exiting={pageOut} style={{ flex: 1 }}>
        <MonthPane day={day} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key={view.id}
      entering={pageIn}
      exiting={pageOut}
      style={{
        flex: 1,
        borderRadius: 32,
        backgroundColor: palette.sheetSolid,
        boxShadow: '0 20px 50px rgba(20,8,30,.25)',
        overflow: 'hidden',
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 18,
        }}
      >
        <PressScale
          scaleTo={0.96}
          onPress={onBack}
          accessibilityRole="button"
          style={{
            alignSelf: 'flex-start',
            height: 40,
            paddingLeft: 8,
            paddingRight: 14,
            borderRadius: 99,
            backgroundColor: palette.chipBg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Symbol name="chevron_left" size={22} color={palette.ink} />
          <Text style={{ ...body(14.5, 600), color: palette.ink }}>
            {dates.month(monthOf(snap.today))}
          </Text>
        </PressScale>
        <View style={{ gap: 22 }}>
          <SpendDetails id={view.id} onDeleted={onBack} />
        </View>
      </ScrollView>
    </Animated.View>
  );
});
