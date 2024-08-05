import { AmountFormat } from '@/components/common/amount-format'
import { ListSkeleton } from '@/components/common/list-skeleton'
import { Toolbar } from '@/components/common/toolbar'
import { HomeHeader } from '@/components/home/header'
import { WalletStatistics } from '@/components/home/wallet-statistics'
import { HandyArrow } from '@/components/transaction/handy-arrow'
import { TransactionItem } from '@/components/transaction/transaction-item'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatDateShort } from '@/lib/date'
import { theme } from '@/lib/theme'
import { walletQueries } from '@/queries/wallet'
import { useTransactionList } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

  const { transactions, isLoading, isRefetching, refetch } = useTransactionList(
    {
      walletAccountId,
      // FIXME: This should be dynamic @bkdev98
      from: dayjsExtended().subtract(10, 'year').startOf('year').toDate(),
      to: dayjsExtended().add(10, 'year').endOf('year').toDate(),
    },
  )

  const handleRefresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: walletQueries.list._def })
  }

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

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: top }}>
      <HomeHeader
        walletAccountId={walletAccountId}
        onWalletAccountChange={setWalletAccountId}
      />
      <SectionList
        ListHeaderComponent={
          <View className="p-6">
            <WalletStatistics />
          </View>
        }
        className="flex-1 bg-card"
        contentContainerStyle={{ paddingBottom: bottom + 32 }}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
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
        // onEndReached={() => {
        //   if (hasNextPage) {
        //     fetchNextPage()
        //   }
        // }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoading ? <ListSkeleton /> : null}
      />
      {!transactions.length && !isLoading && (
        <View className="absolute right-6 bottom-20 z-50 flex-row gap-3">
          <Text>{t(i18n)`Add your first transaction here`}</Text>
          <HandyArrow className="mt-4 text-muted-foreground" />
        </View>
      )}
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'transparent' : '#ffffff00',
          theme[colorScheme ?? 'light'].background,
        ]}
        className="absolute right-0 bottom-0 left-0 h-36"
        pointerEvents="none"
      />
      <Toolbar />
    </View>
  )
}
