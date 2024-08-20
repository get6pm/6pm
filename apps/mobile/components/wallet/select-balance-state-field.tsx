import { WalletBalanceState } from '@6pm/validation'
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

type SelectBalanceStateFieldProps = {
  value: string
  onSelect: (type?: string) => void
  sideOffset?: number
  disabled?: boolean
}

export function SelectBalanceStateField({
  value,
  onSelect,
  sideOffset,
  disabled,
}: SelectBalanceStateFieldProps) {
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
        value: WalletBalanceState.Positive,
        label: t(i18n)`Positive`,
      },
      {
        value: WalletBalanceState.Negative,
        label: t(i18n)`Negative`,
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
          placeholder={t(i18n)`Select balance state`}
        >
          {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        sideOffset={(sideOffset || 0) + 6}
        insets={contentInsets}
        alignOffset={10}
        portalHost="account-form"
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
