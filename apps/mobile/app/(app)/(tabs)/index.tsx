import { AmountFormat } from '@/components/common/amount-format'
import { ListSkeleton } from '@/components/common/list-skeleton'
// import { Toolbar } from '@/components/common/toolbar'
import { HomeHeader } from '@/components/home/header'
import { HomeFilter } from '@/components/home/select-filter'
import { TimeRangeControl } from '@/components/home/time-range-control'
import { HomeView, WalletStatistics } from '@/components/home/wallet-statistics'
import { DraftTransactionList } from '@/components/transaction/draft-transaction-list'
import { HandyArrow } from '@/components/transaction/handy-arrow'
import { TransactionItem } from '@/components/transaction/transaction-item'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatDateShort } from '@/lib/date'
import { theme } from '@/lib/theme'
import { useTransactionList } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { format } from 'date-fns/format'
import { LinearGradient } from 'expo-linear-gradient'
import { groupBy, mapValues, orderBy, sumBy } from 'lodash-es'
import { useMemo, useState } from 'react'
import { SectionList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { i18n } = useLingui()
  const { top, bottom } = useSafeAreaInsets()
  const { colorScheme } = useColorScheme()
  const [walletAccountId, setWalletAccountId] = useState<string | undefined>()
  const [filter, setFilter] = useState<HomeFilter>(HomeFilter.All)
  const [view, setView] = useState<HomeView>(HomeView.SpentThisWeek)
  const [customTimeRange, setCustomTimeRange] = useState<{
    from: Date
    to: Date
  }>({
    from: dayjsExtended().subtract(10, 'year').startOf('year').toDate(),
    to: dayjsExtended().add(10, 'year').endOf('year').toDate(),
  })
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)

  const timeRange = useMemo(() => {
    if (filter !== HomeFilter.All) {
      return customTimeRange
    }
    return {
      from: dayjsExtended().subtract(10, 'year').startOf('year').toDate(),
      to: dayjsExtended().add(10, 'year').endOf('year').toDate(),
    }
  }, [customTimeRange, filter])

  const { transactions, isLoading } = useTransactionList({
    walletAccountId,
    categoryId,
    ...timeRange,
  })

  const handleSetFilter = (filter: HomeFilter) => {
    if (filter === HomeFilter.ByDay) {
      setCustomTimeRange({
        from: dayjsExtended().startOf('day').toDate(),
        to: dayjsExtended().endOf('day').toDate(),
      })
    } else if (filter === HomeFilter.ByWeek) {
      setCustomTimeRange({
        from: dayjsExtended().startOf('week').toDate(),
        to: dayjsExtended().endOf('week').toDate(),
      })
    } else if (filter === HomeFilter.ByMonth) {
      setCustomTimeRange({
        from: dayjsExtended().startOf('month').toDate(),
        to: dayjsExtended().endOf('month').toDate(),
      })
    }
    setFilter(filter)
    setCategoryId(undefined)
  }

  const transactionsGroupByDate = useMemo(() => {
    const groupedByDay = groupBy(transactions, (transaction) =>
      format(new Date(transaction.date), 'yyyy-MM-dd'),
    )

    const sectionDict = mapValues(groupedByDay, (transactions, key) => ({
      key,
      title: formatDateShort(new Date(key)),
      data: orderBy(transactions, 'date', 'desc'),
      sum: sumBy(transactions, 'amountInVnd'),
    }))

    return Object.values(sectionDict)
  }, [transactions])

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: top }}>
      <HomeHeader
        walletAccountId={walletAccountId}
        onWalletAccountChange={setWalletAccountId}
        filter={filter}
        onFilterChange={handleSetFilter}
      />
      {filter !== HomeFilter.All && (
        <TimeRangeControl
          filter={filter}
          timeRange={timeRange}
          onTimeRangeChange={setCustomTimeRange}
        />
      )}
      <SectionList
        ListHeaderComponent={
          filter === HomeFilter.All ? (
            <View>
              <View className="p-6 pb-4">
                <WalletStatistics
                  view={view}
                  onViewChange={(selected) => {
                    setView(selected)
                    setCategoryId(undefined)
                  }}
                  walletAccountId={walletAccountId}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                />
              </View>
              <DraftTransactionList />
            </View>
          ) : null
        }
        className="flex-1 bg-card"
        contentContainerStyle={{ paddingBottom: bottom + 80 }}
        // refreshing={isRefetching}
        // onRefresh={handleRefresh}
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
              convertToDefaultCurrency
            />
          </View>
        )}
        // onEndReached={() => {
        //   if (hasNextPage) {
        //     fetchNextPage()
        //   }
        // }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ListSkeleton /> : null}
        ListEmptyComponent={
          filter !== HomeFilter.All && !isLoading ? (
            <View className="mx-auto my-4">
              <Text className="text-muted-foreground">{t(
                i18n,
              )`No transactions`}</Text>
            </View>
          ) : null
        }
        extraData={filter}
      />
      {!transactions.length && !isLoading && (
        <>
          {filter === HomeFilter.All ? (
            <View className="pointer-events-none absolute right-28 bottom-32 z-50 items-end gap-2">
              <Text>{t(i18n)`Add your first transaction here`}</Text>
              <HandyArrow className="-right-8 text-muted-foreground" />
            </View>
          ) : null}
        </>
      )}
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'transparent' : '#ffffff00',
          theme[colorScheme ?? 'light'].background,
        ]}
        className="absolute right-0 bottom-0 left-0 h-36"
        pointerEvents="none"
      />
      {/* <Toolbar /> */}
    </View>
  )
}
