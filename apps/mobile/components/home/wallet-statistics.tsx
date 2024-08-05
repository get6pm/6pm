import { useWallets } from '@/queries/wallet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Pressable, View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
import { Skeleton } from '../ui/skeleton'
import { Text } from '../ui/text'

export function WalletStatistics() {
  const { i18n } = useLingui()
  const { data: walletAccounts, isLoading } = useWallets()

  /**
   * TODO: Calculate correct amount with currency exchange rate
   * base on the user's preferred currency
   */
  const currentBalance = walletAccounts?.reduce(
    (acc, walletAccount) => acc + (walletAccount?.balance ?? 0),
    0,
  )

  return (
    <View className="gap-3">
      <Pressable className="self-start border-primary border-b">
        <Text className="w-fit self-start leading-tight">
          {t(i18n)`Current balance`}
        </Text>
      </Pressable>
      {isLoading ? (
        <Skeleton className="h-10 w-44" />
      ) : (
        <AmountFormat amount={currentBalance} size="xl" displayNegativeSign />
      )}
    </View>
  )
}
