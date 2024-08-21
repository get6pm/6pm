import { cn } from '@/lib/utils'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { FilterIcon } from 'lucide-react-native'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export enum HomeFilter {
  All = 'ALL',
  ByDay = 'BY_DAY',
  ByWeek = 'BY_WEEK',
  ByMonth = 'BY_MONTH',
}

type SelectFilterProps = {
  value?: HomeFilter
  onSelect?: (type: HomeFilter) => void
}

export function SelectFilter({
  value = HomeFilter.All,
  onSelect,
}: SelectFilterProps) {
  const { i18n } = useLingui()

  const options = [
    {
      value: HomeFilter.All,
      label: t(i18n)`All entries`,
    },
    {
      value: HomeFilter.ByDay,
      label: t(i18n)`By day`,
    },
    {
      value: HomeFilter.ByWeek,
      label: t(i18n)`By week`,
    },
    {
      value: HomeFilter.ByMonth,
      label: t(i18n)`By month`,
    },
  ]

  return (
    <Select
      value={options.find((option) => option.value === value) ?? options[0]}
      onValueChange={(selected) => {
        onSelect?.(selected?.value as HomeFilter)
      }}
    >
      <SelectTrigger
        hideArrow
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className={cn(
          '!h-10 !px-2.5 flex-row items-center gap-2',
          value !== HomeFilter.All && 'border-primary bg-primary',
        )}
      >
        <FilterIcon
          className={cn(
            'h-5 w-5 text-primary',
            value !== HomeFilter.All && 'text-primary-foreground',
          )}
        />
        {value !== HomeFilter.All && (
          <SelectValue
            className={cn('font-medium font-sans text-primary-foreground')}
            placeholder={t(i18n)`All Accounts`}
          >
            {value}
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent sideOffset={6} align="end">
        <SelectGroup className="max-w-[260px] px-1">
          {options.map((option) => (
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
  )
}
