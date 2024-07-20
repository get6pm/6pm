import { BudgetPeriodTypeSchema } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type SelectPeriodTypeFieldProps = {
  value: string
  onSelect: (type?: string) => void
  sideOffset?: number
  disabled?: boolean
}

export function SelectPeriodTypeField({
  value,
  onSelect,
  sideOffset,
  disabled,
}: SelectPeriodTypeFieldProps) {
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
        value: BudgetPeriodTypeSchema.Enum.WEEKLY,
        label: t(i18n)`Weekly`,
      },
      {
        value: BudgetPeriodTypeSchema.Enum.MONTHLY,
        label: t(i18n)`Monthly`,
      },
      {
        value: BudgetPeriodTypeSchema.Enum.QUARTERLY,
        label: t(i18n)`Quarterly`,
      },
      {
        value: BudgetPeriodTypeSchema.Enum.YEARLY,
        label: t(i18n)`Yearly`,
      },
      {
        value: BudgetPeriodTypeSchema.Enum.CUSTOM,
        label: t(i18n)`Specific dates`,
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
        <SelectValue
          className="font-sans text-foreground"
          placeholder={t(i18n)`Select period type`}
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
        <SelectGroup>
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
