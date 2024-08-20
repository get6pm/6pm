import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
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
    <View className="flex-row items-center justify-between gap-6">
      <View className="gap-1">
        <AmountFormat amount={totalRemaining} />
        <Text className="text-muted-foreground">
          {t(i18n)`Left this month`}
        </Text>
      </View>
      <View className="gap-1">
        <AmountFormat amount={remainingPerDay} />
        <Text className="text-right text-muted-foreground">
          {t(i18n)`Left per day`}
        </Text>
      </View>
    </View>
  )
}
