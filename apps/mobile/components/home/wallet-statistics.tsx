import { useTransactionStore } from '@/stores/transaction/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Pressable, View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
import { Text } from '../ui/text'

export function WalletStatistics() {
  const { i18n } = useLingui()
  const { transactions } = useTransactionStore()

  /**
   * TODO: Calculate correct amount with currency exchange rate
   * base on the user's preferred currency
   */
  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0)

  return (
    <View className="gap-3">
      <Pressable className="self-start border-primary border-b">
        <Text className="w-fit self-start leading-tight">
          {t(i18n)`Current balance`}
        </Text>
      </Pressable>
      <AmountFormat amount={currentBalance} size="xl" displayNegativeSign />
    </View>
  )
}
