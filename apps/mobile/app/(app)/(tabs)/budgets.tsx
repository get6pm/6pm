import { BudgetItem } from '@/components/budget/budget-item'
import { BudgetStatistic } from '@/components/budget/budget-statistic'
import { BurndownChart } from '@/components/budget/burndown-chart'
import { Toolbar } from '@/components/common/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useBudgetList } from '@/stores/budget/hooks'
import type { BudgetPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { LinearGradient } from 'expo-linear-gradient'
import { Dimensions, SectionList, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { height } = Dimensions.get('screen')

const chartHeight = 187
const spacing = 16

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<BudgetPopulated>,
)

export default function BudgetsScreen() {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const headerAnimation = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const headerHeight = useSharedValue(height)

  const dummyHeaderStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    }
  })

  const summaryStyle = useAnimatedStyle(() => {
    const extraSectionHeaderSpacing = spacing * 2
    return {
      opacity: interpolate(
        headerAnimation.value,
        [
          0,
          chartHeight,
          chartHeight + extraSectionHeaderSpacing,
          headerHeight.value,
        ],
        [1, 1, 1, 0],
      ),
      transform: [
        {
          translateY: interpolate(
            headerAnimation.value,
            [
              0,
              chartHeight,
              chartHeight + extraSectionHeaderSpacing,
              chartHeight + extraSectionHeaderSpacing + 1,
            ],
            [0, 0, 0, -1],
          ),
        },
      ],
    }
  })

  const chartStyle = useAnimatedStyle(() => ({
    transform: [
      {
        perspective: chartHeight * 5,
      },
      {
        translateY: interpolate(
          headerAnimation.value,
          [0, chartHeight],
          [0, -chartHeight / 2 - spacing],
          Extrapolation.EXTEND,
        ),
      },
      {
        rotateX: `${interpolate(
          headerAnimation.value,
          [0, chartHeight],
          [0, 90],
          Extrapolation.CLAMP,
        )}deg`,
      },
      {
        scaleY: interpolate(
          headerAnimation.value,
          [-chartHeight, 0],
          [1.4, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      headerAnimation.value,
      [0, chartHeight / 2, chartHeight],
      [1, 0.6, 0],
      Extrapolation.CLAMP,
    ),
  }))

  const onScroll = useAnimatedScrollHandler((event) => {
    const { y } = event.contentOffset
    scrollY.value = y
    headerAnimation.value = y
  })

  const {
    spendingBudgets,
    savingBudgets,
    investingBudgets,
    debtBudgets,
    isRefetching,
    isLoading,
    refetch,
  } = useBudgetList()

  const sections = [
    { key: 'SPENDING', title: t(i18n)`Spending`, data: spendingBudgets },
    { key: 'SAVING', title: t(i18n)`Saving`, data: savingBudgets },
    { key: 'INVESTING', title: t(i18n)`Investing`, data: investingBudgets },
    { key: 'DEBT', title: t(i18n)`Debt`, data: debtBudgets },
  ].filter(({ data }) => data.length)

  return (
    <View className="flex-1 bg-card">
      <View
        className="absolute w-full"
        onLayout={(ev) => {
          if (headerHeight.value === ev.nativeEvent.layout.height) {
            return
          }
          headerHeight.value = withTiming(ev.nativeEvent.layout.height, {
            duration: 0,
          })
        }}
      >
        <Animated.View className="gap-6 py-6 px-6" style={summaryStyle}>
          <BudgetStatistic totalRemaining={1000} remainingPerDay={100} />
        </Animated.View>
        <Animated.View
          className="px-6 pb-5"
          style={[{ flexGrow: 0 }, chartStyle]}
        >
          <BurndownChart />
        </Animated.View>
      </View>
      <AnimatedSectionList
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Animated.View style={dummyHeaderStyle} />}
        contentContainerStyle={{ paddingBottom: bottom + 32 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item: budget }) => <BudgetItem budget={budget} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-muted-foreground bg-card py-2 px-6">
            {title}
          </Text>
        )}
        ListFooterComponent={
          (isLoading || isRefetching) && !sections.length ? (
            <View className="gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </View>
          ) : null
        }
      />
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'transparent' : '#ffffff00',
          theme[colorScheme ?? 'light'].background,
        ]}
        className="absolute bottom-0 left-0 right-0 h-36"
        pointerEvents="none"
      />
      <Toolbar />
    </View>
  )
}
