import { cn } from '@/lib/utils'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { type VariantProps, cva } from 'class-variance-authority'
import { Text } from '../ui/text'

const amountVariants = cva('font-semibold shrink-0', {
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

const currencyVariants = cva('text-muted-foreground font-normal', {
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
  displayPositiveColor?: boolean
} & VariantProps<typeof amountVariants>

export function AmountFormat({
  amount = 0,
  currency,
  className,
  size,
  displayNegativeSign,
  displayPositiveColor,
}: AmountFormatProps) {
  const defaultCurrency = useDefaultCurrency()
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
      {(displayNegativeSign ? amount : Math.abs(amount)).toLocaleString() ||
        '0.00'}{' '}
      <Text className={cn(currencyVariants({ size }))}>
        {currency || defaultCurrency}
      </Text>
    </Text>
  )
}
