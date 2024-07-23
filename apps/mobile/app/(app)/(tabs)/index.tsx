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
import { useTransactions } from '@/queries/transaction'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { format } from 'date-fns/format'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo, useState } from 'react'
import { SectionList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TRANSACTIONS_PER_PAGE = 15

export default function HomeScreen() {
  const { i18n } = useLingui()
  const { top, bottom } = useSafeAreaInsets()
  const [walletAccountId, setWalletAccountId] = useState<string | undefined>()
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions({
    last: TRANSACTIONS_PER_PAGE,
    walletAccountId,
  })
  const { colorScheme } = useColorScheme()

  const transactions =
    data?.pages?.reduce((acc, page) => {
      return acc.concat(page.transactions)
    }, [] as TransactionPopulated[]) ?? []

  const transactionsGroupByDate = useMemo(() => {
    const groupedTransactions = transactions.reduce(
      (acc, transaction) => {
        const key = format(transaction.date, 'yyyy-MM-dd')
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(transaction)
        return acc
      },
      {} as Record<string, TransactionPopulated[]>,
    )
    return Object.entries(groupedTransactions)
      .map(([key, data]) => ({
        key,
        title: formatDateShort(new Date(key)),
        data,
      }))
      .sort((a, b) => b.key.localeCompare(a.key))
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
        onRefresh={refetch}
        sections={transactionsGroupByDate}
        keyExtractor={(item) => item.id}
        renderItem={({ item: transaction }) => (
          <TransactionItem transaction={transaction} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-muted-foreground mx-6 bg-card py-2">
            {title}
          </Text>
        )}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading || isFetchingNextPage ? <ListSkeleton /> : null
        }
      />
      {!transactions.length && !isLoading && (
        <View className="absolute bottom-20 flex-row right-6 z-50 gap-3">
          <Text>{t(i18n)`Add your first transaction here`}</Text>
          <HandyArrow className="mt-4 text-muted-foreground" />
        </View>
      )}
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
