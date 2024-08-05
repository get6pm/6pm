import { cn } from '@/lib/utils'
import { useBudgetList } from '@/stores/budget/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { LandPlotIcon } from 'lucide-react-native'
import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Text } from '../ui/text'

export function SelectBudgetField({
  value,
  onSelect,
  disabled,
  sideOffset,
}: {
  value?: string | null
  onSelect?: (type?: string | null) => void
  disabled?: boolean
  sideOffset?: number
}) {
  const { i18n } = useLingui()
  const { data: budgets } = useBudgetList()

  const defaultValue = useMemo(
    () => ({
      value: 'NO_SELECT',
      label: t(i18n)`No budget selected`,
      usagePercentage: 0,
    }),
    [i18n],
  )

  const options = useMemo(
    () => [
      defaultValue,
      ...(budgets?.map((walletAccount) => ({
        value: walletAccount.id,
        label: walletAccount.name,
        usagePercentage: 50,
      })) || []),
    ],
    [budgets, defaultValue],
  )

  return (
    <Select
      defaultValue={defaultValue}
      value={options.find((option) => option.value === value) ?? defaultValue}
      onValueChange={(selected) => {
        if (selected?.value === 'NO_SELECT') {
          onSelect?.(null)
          return
        }
        onSelect?.(selected?.value)
      }}
    >
      <SelectTrigger
        disabled={disabled}
        hideArrow
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="flex-row items-center gap-2 rounded-full"
      >
        <LandPlotIcon className="h-5 w-5 text-primary" />
        <SelectValue
          className={cn(
            'font-medium font-sans text-primary',
            (!value || value === 'NO_SELECT') && '!text-muted-foreground',
          )}
          placeholder={t(i18n)`All Accounts`}
        >
          {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        sideOffset={(sideOffset || 0) + 6}
        align="center"
        portalHost="transaction-form"
      >
        <SelectGroup className="max-w-[260px] px-1">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              label={option.label}
              className="flex-row items-center justify-between"
              extra={
                option.value !== 'NO_SELECT' && (
                  <Text className="text-muted-foreground">
                    {option.usagePercentage}%
                  </Text>
                )
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
