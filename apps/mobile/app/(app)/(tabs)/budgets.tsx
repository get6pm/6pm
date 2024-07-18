import { BudgetItem } from '@/components/budget/budget-item'
import { BudgetStatistic } from '@/components/budget/budget-statistic'
import { BurndownChart } from '@/components/budget/burndown-chart'
import { Toolbar } from '@/components/common/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useBudgetList } from '@/stores/budget/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { LinearGradient } from 'expo-linear-gradient'
import { SectionList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function BudgetsScreen() {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
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
      <SectionList
        ListHeaderComponent={
          <View className="gap-6 pb-4 pt-8">
            <BudgetStatistic totalRemaining={1000} remainingPerDay={100} />
            <BurndownChart />
          </View>
        }
        className="bg-card flex-1"
        contentContainerClassName="px-6"
        contentContainerStyle={{ paddingBottom: bottom + 32 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item: budget }) => <BudgetItem budget={budget} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-muted-foreground bg-card py-2">{title}</Text>
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
