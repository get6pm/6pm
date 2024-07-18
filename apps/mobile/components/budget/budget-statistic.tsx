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

  return (
    <View className="flex-row items-center gap-6 justify-between">
      <View className="gap-1">
        <Text className="font-semibold text-2xl">
          {totalRemaining?.toLocaleString() || '0.00'}{' '}
          <Text className="text-muted-foreground font-normal text-sm">VND</Text>
        </Text>
        <Text className="text-muted-foreground text-sm">
          {t(i18n)`Left this month`}
        </Text>
      </View>
      <View className="gap-1">
        <Text className="font-semibold text-2xl text-right">
          {remainingPerDay?.toLocaleString() || '0.00'}{' '}
          <Text className="text-muted-foreground font-normal text-sm">VND</Text>
        </Text>
        <Text className="text-muted-foreground text-sm text-right">
          {t(i18n)`Left per day`}
        </Text>
      </View>
    </View>
  )
}
