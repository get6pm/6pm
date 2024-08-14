import { cn } from '@/lib/utils'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { type VariantProps, cva } from 'class-variance-authority'
import { useMemo } from 'react'
import { Text } from '../ui/text'

const SHOULD_ROUND_VALUE_CURRENCIES = ['VND']

const amountVariants = cva('line-clamp-1 shrink-0 font-semibold', {
  variants: {
    size: {
      xl: 'text-4xl',
      lg: 'text-3xl',
      md: 'text-2xl',
      sm: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const currencyVariants = cva('font-medium text-muted-foreground', {
  variants: {
    size: {
      xl: 'text-base',
      lg: 'text-sm',
      md: 'text-sm',
      sm: 'text-[10px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type AmountFormatProps = {
  amount?: number
  currency?: string
  className?: string
  displayNegativeSign?: boolean
  displayPositiveSign?: boolean
  displayPositiveColor?: boolean
  convertToDefaultCurrency?: boolean
} & VariantProps<typeof amountVariants>

export function AmountFormat({
  amount = 0,
  currency,
  className,
  size,
  displayNegativeSign,
  displayPositiveSign,
  displayPositiveColor,
  convertToDefaultCurrency,
}: AmountFormatProps) {
  const defaultCurrency = useDefaultCurrency()

  const sign = useMemo(() => {
    if (amount < 0) {
      return displayNegativeSign ? '-' : ''
    }
    if (amount > 0) {
      return displayPositiveSign ? '+' : ''
    }
    return ''
  }, [amount, displayNegativeSign, displayPositiveSign])

  const displayAmount = useMemo(() => {
    const roundedAmount = SHOULD_ROUND_VALUE_CURRENCIES.includes(
      currency || defaultCurrency,
    )
      ? Math.round(amount)
      : amount

    if (!convertToDefaultCurrency) {
      return Math.abs(roundedAmount).toLocaleString()
    }

    // TODO: correct amount with currency exchange rate
    return Math.abs(roundedAmount).toLocaleString()
  }, [amount, convertToDefaultCurrency, currency, defaultCurrency])

  return (
    <Text
      className={cn(
        amountVariants({ size }),
        amount >= 0
          ? displayPositiveColor
            ? 'text-amount-positive'
            : 'text-foreground'
          : 'text-amount-negative',
        className,
      )}
    >
      {sign}
      {displayAmount}{' '}
      <Text className={cn(currencyVariants({ size }))}>
        {convertToDefaultCurrency
          ? defaultCurrency
          : currency || defaultCurrency}
      </Text>
    </Text>
  )
}
