import { AddNewButton } from '@/components/common/add-new-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { WalletAccountItem } from '@/components/wallet/wallet-account-item'
import { useUserEntitlements } from '@/hooks/use-purchases'
import { ENTITLEMENT_LIMIT } from '@/lib/constaints'
import { useWalletList } from '@/stores/wallet/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { useNavigation, useRouter } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useEffect } from 'react'
import { FlatList } from 'react-native'

export default function WalletAccountsScreen() {
  const { i18n } = useLingui()
  const { wallets: walletAccounts, isLoading, refetch } = useWalletList()
  const router = useRouter()
  const navigation = useNavigation()
  const { entitlement } = useUserEntitlements()

  const isExceeded =
    ENTITLEMENT_LIMIT[entitlement]?.wallets <= (walletAccounts?.length ?? 0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Link href={isExceeded ? '/paywall' : '/wallet/new-account'} asChild>
          <Button size="icon" variant="ghost">
            <PlusIcon className="size-6 text-primary" />
          </Button>
        </Link>
      ),
    })
  }, [isExceeded])

  return (
    <FlatList
      className="bg-card"
      contentContainerClassName="py-3"
      data={walletAccounts}
      renderItem={({ item }) => <WalletAccountItem data={item} />}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      extraData={[isExceeded]}
      ListFooterComponent={
        <AddNewButton
          label={t(i18n)`New account`}
          onPress={() =>
            router.push(isExceeded ? '/paywall' : '/wallet/new-account')
          }
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
          <Text className="mt-6 mb-9 text-center text-muted-foreground">
            {t(i18n)`empty`}
          </Text>
        )
      }
    />
  )
}
