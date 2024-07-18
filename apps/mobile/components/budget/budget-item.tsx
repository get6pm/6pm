import { cn } from '@/lib/utils'
import type { BudgetPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { Link } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { calculateBudgetPeriodStartEndDates } from '@6pm/utilities'
import { Progress } from '../ui/progress'
import { Text } from '../ui/text'

type BudgetItemProps = {
  budget: BudgetPopulated
}

export const BudgetItem: FC<BudgetItemProps> = ({ budget }) => {
  const { i18n } = useLingui()

  const remainingBalance = 0

  const remainingDays = useMemo(() => {
    let periodEndDate: Date | null
    if (budget.periodConfig.type === 'CUSTOM') {
      periodEndDate = budget.periodConfig.endDate
    } else {
      const { endDate } = calculateBudgetPeriodStartEndDates({
        anchorDate: new Date(),
        type: budget.periodConfig.type,
      })
      periodEndDate = endDate
    }

    if (!periodEndDate) {
      return t(i18n)`Unknown`
    }

    const duration = formatDuration(
      intervalToDuration({
        start: new Date(),
        end: periodEndDate,
      }),
      {
        format: ['days', 'hours'],
        delimiter: ',',
      },
    )

    return t(i18n)`${duration?.split(',')[0]} left`
  }, [budget.periodConfig, i18n])

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/budget/[budgetId]',
        params: { budgetId: budget.id },
      }}
    >
      <Pressable className="gap-3 mb-3 mt-1 justify-between px-4 py-3 active:bg-muted border border-border rounded-lg">
        <View className="flex-row items-center gap-6 justify-between">
          <Text numberOfLines={1} className="flex-1 line-clamp-1 font-semibold">
            {budget.name}
          </Text>
          <Text
            className={cn(
              'font-semibold shrink-0 text-xl',
              remainingBalance < 0 && 'text-amount-negative',
            )}
          >
            {Math.abs(remainingBalance).toLocaleString() ?? '0.00'}{' '}
            <Text className="text-muted-foreground text-[10px] font-normal">
              {budget.preferredCurrency}
            </Text>
          </Text>
        </View>
        <Progress value={50} className="h-1.5" />
        <View className="flex-row items-center gap-6 justify-between">
          <Text
            numberOfLines={1}
            className="flex-1 line-clamp-1 text-muted-foreground text-sm"
          >
            {remainingDays}
          </Text>
          <Text className="text-sm font-normal">50%</Text>
        </View>
      </Pressable>
    </Link>
  )
}
