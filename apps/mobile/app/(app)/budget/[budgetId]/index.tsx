import { BudgetStatistic } from '@/components/budget/budget-statistic'
import { BurndownChart } from '@/components/budget/burndown-chart'
import { PeriodControl } from '@/components/budget/period-control'
import { AmountFormat } from '@/components/common/amount-format'
import { ListSkeleton } from '@/components/common/list-skeleton'
import { TransactionItem } from '@/components/transaction/transaction-item'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatDateShort } from '@/lib/date'
import { theme } from '@/lib/theme'
import { useBudget } from '@/stores/budget/hooks'
import { useTransactionList } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useLocalSearchParams, useNavigation } from 'expo-router'
import { groupBy, mapValues, orderBy, sortBy, sumBy } from 'lodash-es'
import { SettingsIcon } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Dimensions, SectionList, View } from 'react-native'
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
  SectionList<TransactionPopulated>,
)

export default function BudgetDetailScreen() {
  const navigation = useNavigation()
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const headerAnimation = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const headerHeight = useSharedValue(height)

  const { budgetId } = useLocalSearchParams<{ budgetId: string }>()
  const { budget } = useBudget(budgetId!)
  const periodConfigs = sortBy(budget?.periodConfigs, (pc) => pc.startDate)
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number>(0)
  const currentPeriod = periodConfigs[currentPeriodIndex]

  const { transactions, isLoading, isRefetching, refetch } = useTransactionList(
    {
      budgetId,
      from:
        currentPeriod?.startDate || dayjsExtended().startOf('month').toDate(),
      to: currentPeriod?.endDate || dayjsExtended().endOf('month').toDate(),
    },
  )

  const transactionsGroupByDate = useMemo(() => {
    const groupedByDay = groupBy(transactions, (transaction) =>
      format(new Date(transaction.date), 'yyyy-MM-dd'),
    )

    const sectionDict = mapValues(groupedByDay, (transactions, key) => ({
      key,
      title: formatDateShort(new Date(key)),
      data: orderBy(transactions, 'date', 'desc'),
      sum: sumBy(transactions, 'amount'),
    }))

    return Object.values(sectionDict)
  }, [transactions])

  useEffect(() => {
    navigation.setOptions({
      title: budget?.name,
      headerRight: () => (
        <View className="flex-row gap-2">
          {/* <Button size="icon" variant="ghost">
            <UserPlusIcon className="size-6 text-primary" />
          </Button> */}
          <Link
            href={{
              pathname: '/budget/[budgetId]/edit',
              params: { budgetId: budget?.id },
            }}
            asChild
            push
          >
            <Button size="icon" variant="ghost">
              <SettingsIcon className="size-6 text-primary" />
            </Button>
          </Link>
        </View>
      ),
    })
  }, [navigation, budget])

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

  if (!budget) {
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card">
      <PeriodControl
        periodConfigs={periodConfigs}
        index={currentPeriodIndex}
        onChange={setCurrentPeriodIndex}
      />
      <View
        className="absolute top-12 w-full"
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            totalRemaining={currentPeriod.amount as any}
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            remainingPerDay={currentPeriod.amount as any}
          />
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
        sections={transactionsGroupByDate}
        keyExtractor={(item) => item.id}
        renderItem={({ item: transaction }) => (
          <TransactionItem transaction={transaction} />
        )}
        renderSectionHeader={({ section: { title, sum } }) => (
          <View className="mx-6 flex-row justify-between border-muted-foreground/20 border-b bg-card py-2 pt-4 align-center">
            <Text className="text-muted-foreground">{title}</Text>
            <AmountFormat
              amount={sum}
              className="font-semibold text-md text-muted-foreground"
              displayNegativeSign
              displayPositiveSign
            />
          </View>
        )}
        ListFooterComponent={
          isLoading || isRefetching ? <ListSkeleton /> : null
        }
        ListEmptyComponent={
          !isLoading && !isRefetching ? (
            <Text className="mx-auto my-2 text-center text-muted-foreground">{t(
              i18n,
            )`No transactions found`}</Text>
          ) : null
        }
      />
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'transparent' : '#ffffff00',
          theme[colorScheme ?? 'light'].background,
        ]}
        className="absolute right-0 bottom-0 left-0 h-16"
        pointerEvents="none"
      />
    </View>
  )
}
