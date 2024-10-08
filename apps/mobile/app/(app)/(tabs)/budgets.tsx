import { BudgetItem } from '@/components/budget/budget-item'
import { BudgetStatistic } from '@/components/budget/budget-statistic'
import { BurndownChart } from '@/components/common/burndown-chart'
import { FooterGradient } from '@/components/common/footer-gradient'
import { Button } from '@/components/ui/button'
// import { Toolbar } from '@/components/common/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useUserEntitlements } from '@/hooks/use-purchases'
import { ENTITLEMENT_LIMIT } from '@/lib/constaints'
import { useBudgetList } from '@/stores/budget/hooks'
import { useTransactionList } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import type { Budget, BudgetPeriodConfig } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, useNavigation } from 'expo-router'
import { groupBy, map } from 'lodash-es'
import { PlusIcon } from 'lucide-react-native'
import { useEffect } from 'react'
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

type BudgetPopulated = Budget & {
  periodConfigs: BudgetPeriodConfig[]
}

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<BudgetPopulated>,
)

export default function BudgetsScreen() {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const headerAnimation = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const headerHeight = useSharedValue(height)
  const navigation = useNavigation()

  const dummyHeaderStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    }
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            headerAnimation.value,
            [0, chartHeight * 1.5, chartHeight * 1.7],
            [0, 0, -chartHeight],
            Extrapolation.EXTEND,
          ),
        },
      ],
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
    totalBudget,
    isRefetching,
    isLoading,
    refetch,
  } = useBudgetList()

  const { entitlement } = useUserEntitlements()

  const isExceeded =
    ENTITLEMENT_LIMIT[entitlement]?.wallets <= (spendingBudgets?.length ?? 0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Link href={isExceeded ? '/paywall' : '/budget/new-budget'} asChild>
          <Button size="sm" variant="outline" className="mr-6 h-10">
            <PlusIcon className="size-6 text-foreground" />
            <Text>{t(i18n)`New budget`}</Text>
          </Button>
        </Link>
      ),
    })
  }, [isExceeded])

  const { transactions } = useTransactionList({
    from: dayjsExtended().startOf('month').toDate(),
    to: dayjsExtended().endOf('month').toDate(),
  })

  const totalBudgetUsage = transactions.reduce((acc, t) => {
    if (!t.budgetId) {
      return acc
    }
    return acc + t.amountInVnd
  }, 0)

  const chartData = map(
    groupBy(
      transactions.filter((i) => !!i.budgetId),
      (transaction) => dayjsExtended(transaction.date).format('YYYY-MM-DD'),
    ),
    (transactions, key) => ({
      day: new Date(key).getDate(),
      amount: transactions.reduce((acc, t) => acc - t.amountInVnd, 0),
    }),
  )

  const totalRemaining = totalBudget.add(totalBudgetUsage)

  const daysInMonth = dayjsExtended().daysInMonth()
  const remainingDays = daysInMonth - dayjsExtended().get('date')
  const remainingPerDay = totalRemaining.div(remainingDays)
  const averagePerDay = totalBudget.div(daysInMonth)

  const sections = [
    { key: 'SPENDING', title: t(i18n)`Spending`, data: spendingBudgets },
    { key: 'SAVING', title: t(i18n)`Saving`, data: savingBudgets },
    { key: 'INVESTING', title: t(i18n)`Investing`, data: investingBudgets },
    { key: 'DEBT', title: t(i18n)`Debt`, data: debtBudgets },
  ].filter(({ data }) => data.length)

  return (
    <View className="flex-1 bg-background">
      <Animated.View
        className="absolute z-50 w-full"
        style={headerStyle}
        onLayout={(ev) => {
          if (headerHeight.value === ev.nativeEvent.layout.height) {
            return
          }
          headerHeight.value = withTiming(ev.nativeEvent.layout.height, {
            duration: 0,
          })
        }}
      >
        <Animated.View className="gap-6 px-6 py-6" style={summaryStyle}>
          <BudgetStatistic
            totalRemaining={totalRemaining.toNumber()}
            remainingPerDay={remainingPerDay.toNumber()}
          />
        </Animated.View>
        <Animated.View
          className="px-6 pb-5"
          style={[{ flexGrow: 0 }, chartStyle]}
        >
          <BurndownChart
            totalBudget={totalBudget.toNumber()}
            averagePerDay={averagePerDay.toNumber()}
            data={chartData}
          />
        </Animated.View>
      </Animated.View>
      <AnimatedSectionList
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Animated.View style={dummyHeaderStyle} />}
        contentContainerStyle={{ paddingBottom: bottom + 80 }}
        refreshing={false}
        onRefresh={refetch}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item: budget }) => <BudgetItem budget={budget} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="bg-background px-6 py-2 text-muted-foreground">
            {title}
          </Text>
        )}
        ListFooterComponent={
          (isLoading || isRefetching) && !sections.length ? (
            <View className="gap-4 px-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </View>
          ) : null
        }
      />
      <FooterGradient />
      {/* <Toolbar /> */}
    </View>
  )
}
