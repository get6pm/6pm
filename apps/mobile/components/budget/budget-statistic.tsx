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
    <View className="flex-row items-center gap-6 justify-between">
      <View className="gap-1">
        <Text className="font-bold text-2xl">
          {totalRemaining?.toLocaleString() || '0.00'}{' '}
          <Text className="text-muted-foreground font-normal text-sm">
            {defaultCurrency}
          </Text>
        </Text>
        <Text className="text-muted-foreground">
          {t(i18n)`Left this month`}
        </Text>
      </View>
      <View className="gap-1">
        <Text className="font-bold text-2xl text-right">
          {remainingPerDay?.toLocaleString() || '0.00'}{' '}
          <Text className="text-muted-foreground font-normal text-sm">
            {defaultCurrency}
          </Text>
        </Text>
        <Text className="text-muted-foreground text-right">
          {t(i18n)`Left per day`}
        </Text>
      </View>
    </View>
  )
}
