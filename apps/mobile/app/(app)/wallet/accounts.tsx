import { AddNewButton } from '@/components/common/add-new-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { WalletAccountItem } from '@/components/wallet/wallet-account-item'
import { useWallets } from '@/queries/wallet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { FlatList } from 'react-native'

export default function WalletAccountsScreen() {
  const { i18n } = useLingui()
  const { data: walletAccounts, isLoading, refetch } = useWallets()
  const router = useRouter()
  return (
    <FlatList
      className="bg-card"
      contentContainerClassName="py-3"
      data={walletAccounts}
      renderItem={({ item }) => <WalletAccountItem data={item} />}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      ListFooterComponent={
        <AddNewButton
          label={t(i18n)`New account`}
          onPress={() => router.push('/wallet/new-account')}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <>
            <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
            <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
            <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
          </>
        ) : (
          <Text className="mt-6 mb-9 text-center font-sans text-muted-foreground">
            {t(i18n)`empty`}
          </Text>
        )
      }
    />
  )
}
