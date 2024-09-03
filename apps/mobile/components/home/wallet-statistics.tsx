import { useTransactionList } from '@/stores/transaction/hooks'
import { dayjsExtended } from '@6pm/utilities'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMemo } from 'react'
import { View } from 'react-native'
import { AmountFormat } from '../common/amount-format'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from '../ui/select'
import { Text } from '../ui/text'
import { CategoryChart } from './category-chart'

export enum HomeView {
  SpentThisWeek = 'SPENT_THIS_WEEK',
  SpentThisMonth = 'SPENT_THIS_MONTH',
  RevenueThisWeek = 'REVENUE_THIS_WEEK',
  RevenueThisMonth = 'REVENUE_THIS_MONTH',
  CurrentBalance = 'CURRENT_BALANCE',
}

type WalletStatisticsProps = {
  view?: HomeView
  onViewChange?: (view: HomeView) => void
  walletAccountId?: string
  categoryId?: string
  onCategoryChange?: (categoryId?: string) => void
}

export function WalletStatistics({
  view = HomeView.SpentThisWeek,
  onViewChange,
  walletAccountId,
  categoryId,
  onCategoryChange,
}: WalletStatisticsProps) {
  const { i18n } = useLingui()

  const timeRange = useMemo(() => {
    if (view === HomeView.SpentThisWeek || view === HomeView.RevenueThisWeek) {
      return {
        from: dayjsExtended().startOf('week').toDate(),
        to: dayjsExtended().endOf('week').toDate(),
      }
    }

    if (
      view === HomeView.SpentThisMonth ||
      view === HomeView.RevenueThisMonth
    ) {
      return {
        from: dayjsExtended().startOf('month').toDate(),
        to: dayjsExtended().endOf('month').toDate(),
      }
    }

    return {
      from: dayjsExtended().subtract(10, 'year').startOf('year').toDate(),
      to: dayjsExtended().add(10, 'year').endOf('year').toDate(),
    }
  }, [view])

  const { totalExpense, totalIncome, transactions } = useTransactionList({
    walletAccountId,
    ...timeRange,
  })

  const totalValue = useMemo(() => {
    if (view === HomeView.SpentThisWeek || view === HomeView.SpentThisMonth) {
      return totalExpense
    }
    if (
      view === HomeView.RevenueThisWeek ||
      view === HomeView.RevenueThisMonth
    ) {
      return totalIncome
    }
    if (view === HomeView.CurrentBalance) {
      return totalIncome + totalExpense
    }
  }, [totalExpense, totalIncome, view])

  const options = [
    {
      value: HomeView.SpentThisWeek,
      label: t(i18n)`Spent this week`,
    },
    {
      value: HomeView.SpentThisMonth,
      label: t(i18n)`Spent this month`,
    },
    {
      value: HomeView.RevenueThisWeek,
      label: t(i18n)`Revenue this week`,
    },
    {
      value: HomeView.RevenueThisMonth,
      label: t(i18n)`Revenue this month`,
    },
    {
      value: HomeView.CurrentBalance,
      label: t(i18n)`Current balance`,
    },
  ]

  return (
    <View className="items-center gap-6">
      <Select
        value={options.find((option) => option.value === view) ?? options[0]}
        onValueChange={(selected) => {
          onViewChange?.(selected?.value as HomeView)
        }}
      >
        <SelectTrigger
          hideArrow
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          // className={cn(
          //   '!h-10 !px-2.5 flex-row items-center gap-2',
          //   value !== HomeFilter.All && 'border-primary bg-primary',
          // )}
          className="!border-0 h-auto native:h-auto flex-col items-center gap-3"
        >
          <View className="self-center border-primary border-b">
            <Text className="w-fit self-center text-center leading-tight">
              {options.find((option) => option.value === view)?.label}
            </Text>
          </View>
          <AmountFormat
            amount={totalValue}
            size="xl"
            displayNegativeSign
            displayPositiveColor
            convertToDefaultCurrency
          />
        </SelectTrigger>
        <SelectContent sideOffset={6} align="center">
          <SelectGroup className="px-1">
            {options.slice(0, 2).map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                label={option.label}
                className="flex-row items-center justify-between"
              >
                {option.label}
              </SelectItem>
            ))}
            <SelectSeparator />
            {options.slice(2, 4).map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                label={option.label}
                className="flex-row items-center justify-between"
              >
                {option.label}
              </SelectItem>
            ))}
            <SelectSeparator />
            {options.slice(4).map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                label={option.label}
                className="flex-row items-center justify-between"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {view !== HomeView.CurrentBalance ? (
        <CategoryChart
          selected={categoryId}
          onSelect={onCategoryChange}
          transactions={transactions.filter((t) => {
            if (
              view === HomeView.SpentThisWeek ||
              view === HomeView.SpentThisMonth
            ) {
              return t.amountInVnd < 0
            }
            if (
              view === HomeView.RevenueThisWeek ||
              view === HomeView.RevenueThisMonth
            ) {
              return t.amountInVnd > 0
            }
          })}
        />
      ) : null}
    </View>
  )
}
