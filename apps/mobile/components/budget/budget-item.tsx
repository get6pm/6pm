import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import type { FC } from 'react'
import { Pressable, View } from 'react-native'

import { useUserMetadata } from '@/hooks/use-user-metadata'
import {
  getLatestPeriodConfig,
  useBudgetPeriodStats,
} from '@/stores/budget/hooks'
import type { BudgetItem as BudgetItemData } from '@/stores/budget/store'
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
  const { defaultBudgetId } = useUserMetadata()

  const latestPeriodConfig = getLatestPeriodConfig(budget.periodConfigs)

  const {
    remainingAmount,
    usagePercentage,
    remainingAmountPerDays,
    remainingDays,
    isExceeded,
  } = useBudgetPeriodStats(latestPeriodConfig!)

  const isDefault = defaultBudgetId === budget.id

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
          <View className="flex-1 gap-2">
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
              {isDefault && (
                <Badge variant="secondary">
                  <Text className="text-sm capitalize">{t(i18n)`Default`}</Text>
                </Badge>
              )}
              <Badge variant="outline">
                <Text className="text-sm capitalize">
                  {latestPeriodConfig?.type}
                </Text>
              </Badge>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <CircularProgress
              progress={usagePercentage}
              strokeColor={isExceeded ? '#ef4444' : undefined}
            />
            <ChevronRightIcon className="size-6 text-foreground" />
          </View>
        </View>
        <Separator />
        <View className="flex-row items-center justify-between gap-6">
          <View className="flex-1 gap-1">
            <AmountFormat
              amount={remainingAmount?.toNumber() ?? 0}
              displayNegativeSign
              className="text-xl"
            />
            <Text
              numberOfLines={1}
              className="line-clamp-1 flex-1 text-muted-foreground text-sm"
            >
              {t(i18n)`${remainingDays} days left`}
            </Text>
          </View>
          <View className="justify-end gap-1">
            <AmountFormat
              amount={remainingAmountPerDays?.toNumber() ?? 0}
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
