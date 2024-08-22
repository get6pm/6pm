import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { Link } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import type { BudgetItem as BudgetItemData } from '@/stores/budget/store'
import { useTransactionList } from '@/stores/transaction/hooks'
import {
  calculateBudgetPeriodStartEndDates,
  dayjsExtended,
} from '@6pm/utilities'
import { useUser } from '@clerk/clerk-expo'
import { first, orderBy } from 'lodash-es'
import { ChevronRightIcon } from 'lucide-react-native'
import { AmountFormat } from '../common/amount-format'
import { CircularProgress } from '../common/circular-progress'
import { UserAvatar } from '../common/user-avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Text } from '../ui/text'

type BudgetItemProps = {
  budget: BudgetItemData
}

export const BudgetItem: FC<BudgetItemProps> = ({ budget }) => {
  const { i18n } = useLingui()
  const { user } = useUser()

  const latestPeriodConfig = first(
    orderBy(budget.periodConfigs, 'startDate', 'desc'),
  )

  const { totalExpense, totalIncome } = useTransactionList({
    from: latestPeriodConfig?.startDate!,
    to: latestPeriodConfig?.endDate!,
    budgetId: budget.id,
  })

  const totalBudgetUsage = totalExpense + totalIncome

  const remainingBalance = Math.round(
    Number(latestPeriodConfig?.amount!) + totalBudgetUsage,
  )

  const usagePercentage = Math.round(
    (Math.abs(totalBudgetUsage) / Number(latestPeriodConfig?.amount)) * 100,
  )

  const remainingDuration = useMemo(() => {
    let periodEndDate: Date | null
    if (latestPeriodConfig?.type === 'CUSTOM') {
      periodEndDate = latestPeriodConfig?.endDate
    } else {
      const { endDate } = calculateBudgetPeriodStartEndDates({
        anchorDate: new Date(),
        type: latestPeriodConfig?.type ?? 'MONTHLY',
      })
      periodEndDate = endDate
    }

    if (!periodEndDate) {
      return null
    }

    return intervalToDuration({
      start: new Date(),
      end: periodEndDate,
    })
  }, [latestPeriodConfig])

  const remainingDaysText = useMemo(() => {
    if (!remainingDuration) {
      return t(i18n)`Unknown`
    }

    const duration = formatDuration(remainingDuration, {
      format: ['days', 'hours'],
      delimiter: ',',
    })

    return t(i18n)`${duration.split(',')[0]} left`
  }, [remainingDuration, i18n])

  const remainingDays =
    dayjsExtended().daysInMonth() - dayjsExtended().get('date')

  const amountPerDay = remainingBalance / remainingDays

  const isOver =
    remainingBalance < 0 || remainingBalance < amountPerDay * remainingDays

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/budget/[budgetId]',
        params: { budgetId: budget.id },
      }}
    >
      <Pressable className="mx-6 mt-1 mb-3 justify-between gap-4 rounded-lg border border-border p-4">
        <View className="flex-row items-center justify-between gap-6">
          <View className="gap-2">
            <Text
              numberOfLines={1}
              className="line-clamp-1 flex-1 font-semibold text-lg"
            >
              {budget.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <UserAvatar
                user={user!}
                className="h-7 w-7"
                fallbackLabelClassName="text-[10px]"
              />
              <Badge variant="outline" className="rounded-full">
                <Text className="text-sm capitalize">
                  {budget.periodConfigs[0].type}
                </Text>
              </Badge>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <CircularProgress
              progress={usagePercentage}
              strokeColor={isOver ? '#ef4444' : undefined}
            />
            <ChevronRightIcon className="size-6 text-foreground" />
          </View>
        </View>
        <Separator />
        <View className="flex-row items-center justify-between gap-6">
          <View className="flex-1 gap-1">
            <AmountFormat
              amount={remainingBalance}
              displayNegativeSign
              className="text-xl"
            />
            <Text
              numberOfLines={1}
              className="line-clamp-1 flex-1 text-muted-foreground text-sm"
            >
              {remainingDaysText}
            </Text>
          </View>
          <View className="justify-end gap-1">
            <AmountFormat
              amount={Math.round(amountPerDay)}
              displayNegativeSign
              className="text-xl"
            />
            <Text
              numberOfLines={1}
              className="line-clamp-1 flex-1 text-right text-muted-foreground text-sm"
            >
              {t(i18n)`per day`}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
