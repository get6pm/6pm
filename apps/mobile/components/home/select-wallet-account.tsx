import { useWalletList } from '@/stores/wallet/hooks'
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
  const { wallets } = useWalletList()

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
      ...(wallets?.map((walletAccount) => ({
        value: walletAccount.id,
        label: walletAccount.name,
      })) || []),
    ],
    [wallets, defaultValue],
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
        className="!border-none !border-transparent !py-0 !h-6 flex-row items-center gap-2 self-start px-0"
      >
        <SelectValue
          className="font-medium text-foreground"
          placeholder={t(i18n)`All Accounts`}
        >
          {value}
        </SelectValue>
        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
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
