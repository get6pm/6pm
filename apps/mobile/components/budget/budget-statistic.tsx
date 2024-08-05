import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { View } from 'react-native'
import { Text } from '../ui/text'

type BudgetStatisticProps = {
  totalRemaining: number
  remainingPerDay: number
}

export function BudgetStatistic({
  totalRemaining,
  remainingPerDay,
}: BudgetStatisticProps) {
  const { i18n } = useLingui()
  const defaultCurrency = useDefaultCurrency()

  return (
    <View className="flex-row items-center justify-between gap-6">
      <View className="gap-1">
        <Text className="font-bold text-2xl">
          {totalRemaining?.toLocaleString() || '0.00'}{' '}
          <Text className="font-normal text-muted-foreground text-sm">
            {defaultCurrency}
          </Text>
        </Text>
        <Text className="text-muted-foreground">
          {t(i18n)`Left this month`}
        </Text>
      </View>
      <View className="gap-1">
        <Text className="text-right font-bold text-2xl">
          {remainingPerDay?.toLocaleString() || '0.00'}{' '}
          <Text className="font-normal text-muted-foreground text-sm">
            {defaultCurrency}
          </Text>
        </Text>
        <Text className="text-right text-muted-foreground">
          {t(i18n)`Left per day`}
        </Text>
      </View>
    </View>
  )
}
