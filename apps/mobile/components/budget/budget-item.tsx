import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { Link } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import type { BudgetItem as BudgetItemData } from '@/stores/budget/store'
import { calculateBudgetPeriodStartEndDates } from '@6pm/utilities'
import { useUser } from '@clerk/clerk-expo'
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

  const remainingBalance = 2500000

  const amountPerDay = 312500

  const usagePercentage = 80

  const remainingDays = useMemo(() => {
    let periodEndDate: Date | null
    if (budget.periodConfigs?.[0]?.type === 'CUSTOM') {
      periodEndDate = budget.periodConfigs?.[0]?.endDate
    } else {
      const { endDate } = calculateBudgetPeriodStartEndDates({
        anchorDate: new Date(),
        type: budget.periodConfigs?.[0]?.type,
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
  }, [budget.periodConfigs, i18n])

  return (
    <Link
      asChild
      push
      href={{
        pathname: '/budget/[budgetId]',
        params: { budgetId: budget.id },
      }}
    >
      <Pressable className="gap-4 mb-3 mt-1 justify-between p-4 border border-border rounded-lg">
        <View className="flex-row items-center gap-6 justify-between">
          <View className="gap-2">
            <Text
              numberOfLines={1}
              className="flex-1 line-clamp-1 font-semibold text-lg"
            >
              {budget.name}
            </Text>
            <View className="flex-row items-center gap-2">
              <UserAvatar
                user={user!}
                className="w-7 h-7"
                fallbackLabelClassName="text-[10px]"
              />
              <Badge variant="outline" className="rounded-full">
                <Text className="text-sm capitalize">
                  {budget.periodConfigs[0].type}
                </Text>
              </Badge>
            </View>
          </View>
          <View className="gap-2 items-center flex-row">
            <CircularProgress progress={usagePercentage} />
            <ChevronRightIcon className="size-6 text-foreground" />
          </View>
        </View>
        <Separator />
        <View className="flex-row items-center gap-6 justify-between">
          <View className="gap-1">
            <AmountFormat
              amount={remainingBalance}
              displayNegativeSign
              className="text-xl"
            />
            <Text
              numberOfLines={1}
              className="flex-1 line-clamp-1 text-muted-foreground text-sm"
            >
              {remainingDays}
            </Text>
          </View>
          <View className="gap-1 justify-end">
            <AmountFormat
              amount={amountPerDay}
              displayNegativeSign
              className="text-xl"
            />
            <Text
              numberOfLines={1}
              className="flex-1 line-clamp-1 text-right text-muted-foreground text-sm"
            >
              {t(i18n)`per day`}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
