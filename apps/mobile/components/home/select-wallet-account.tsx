import { useWallets } from '@/queries/wallet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ArrowDownUp } from 'lucide-react-native'
import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function SelectWalletAccount({
  value,
  onSelect,
  disabled,
}: {
  value?: string
  onSelect?: (type?: string) => void
  disabled?: boolean
}) {
  const { i18n } = useLingui()
  const { data: walletAccounts } = useWallets()

  const defaultValue = useMemo(
    () => ({
      value: 'ALL',
      label: t(i18n)`All accounts`,
    }),
    [i18n],
  )

  const options = useMemo(
    () => [
      defaultValue,
      ...(walletAccounts?.map((walletAccount) => ({
        value: walletAccount.id,
        label: walletAccount.name,
      })) || []),
    ],
    [walletAccounts, defaultValue],
  )

  return (
    <Select
      defaultValue={defaultValue}
      value={options.find((option) => option.value === value) ?? defaultValue}
      onValueChange={(selected) => {
        if (selected?.value === 'ALL') {
          onSelect?.(undefined)
          return
        }
        onSelect?.(selected?.value)
      }}
    >
      <SelectTrigger
        disabled={disabled}
        hideArrow
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="gap-2 items-center flex-row !border-none !border-transparent px-0 !py-0 !h-6"
      >
        <SelectValue
          className="text-primary font-sans font-medium"
          placeholder={t(i18n)`All Accounts`}
        >
          {value}
        </SelectValue>
        <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent sideOffset={6}>
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
