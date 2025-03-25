'use client'
import { Button } from '@6pm/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@6pm/ui/components/command'
import type { FieldError } from '@6pm/ui/components/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@6pm/ui/components/popover'
import { cn } from '@6pm/ui/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { type FC, type ReactNode, useEffect, useState } from 'react'

export type CurrencyComboBoxProps = {
  currencies: { value: string; label: ReactNode }[]
  error?: FieldError
  disabled?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
}

export const CurrencyComboBox: FC<CurrencyComboBoxProps> = ({
  currencies,
  error,
  disabled,
  placeholder,
  value: controlledValue,
  onChange,
  onBlur,
}) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(controlledValue || '')

  const handleSelect = (newValue: string) => {
    setValue(newValue)
    onChange?.(newValue)
    setOpen(false)
  }

  useEffect(() => {
    setValue(controlledValue || '')
  }, [controlledValue])

  useEffect(() => {
    if (!open) {
      onBlur?.()
    }
  }, [open, onBlur])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          data-slot="input"
          className={cn(
            'max-w-sm justify-between font-medium transition-all',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
            open && 'border-ring ring-[3px] ring-ring/50',
            !value && 'text-muted-foreground',
          )}
        >
          {value
            ? currencies.find((currency) => currency.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-sm p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.value}
                  value={currency.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0 text-accent-main',
                      value === currency.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {currency.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
