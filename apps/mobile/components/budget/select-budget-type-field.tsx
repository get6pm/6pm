import { BudgetTypeSchema } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GenericIcon from '../common/generic-icon'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type SelectBudgetTypeFieldProps = {
  value: string
  onSelect: (type?: string) => void
  sideOffset?: number
  disabled?: boolean
}

export function SelectBudgetTypeField({
  value,
  onSelect,
  sideOffset,
  disabled,
}: SelectBudgetTypeFieldProps) {
  const { i18n } = useLingui()
  const insets = useSafeAreaInsets()
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom + Math.abs(sideOffset || 0),
    left: 21,
    right: 21,
  }

  const options = useMemo(
    () => [
      {
        value: BudgetTypeSchema.Enum.SPENDING,
        label: t(i18n)`Spending`,
        icon: 'HandCoins',
      },
      {
        value: BudgetTypeSchema.Enum.SAVING,
        label: t(i18n)`Saving`,
        icon: 'PiggyBank',
      },
      {
        value: BudgetTypeSchema.Enum.INVESTING,
        label: t(i18n)`Investing`,
        icon: 'TrendingUp',
      },
      {
        value: BudgetTypeSchema.Enum.DEBT,
        label: t(i18n)`Debt`,
        icon: 'Landmark',
      },
    ],
    [i18n],
  )

  return (
    <Select
      defaultValue={options[0]}
      value={options.find((option) => option.value === value)}
      onValueChange={(selected) => onSelect(selected?.value)}
    >
      <SelectTrigger disabled={disabled}>
        <GenericIcon
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          name={options.find((option) => option.value === value)?.icon as any}
          className="absolute left-3 h-5 w-5 text-foreground"
        />
        <SelectValue
          className="left-8 font-sans text-foreground"
          placeholder={t(i18n)`Select budget type`}
        >
          {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        sideOffset={(sideOffset || 0) + 6}
        insets={contentInsets}
        alignOffset={10}
        portalHost="budget-form"
        className="w-full"
      >
        <SelectGroup className="px-1">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              label={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
