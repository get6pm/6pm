import { useCurrentSpace } from '@/hooks/spaces'
import { SUPPORTED_CURRENCIES } from '@6pm/db/static-data/currency'
import { cn } from '@6pm/ui/lib/utils'
import numeral from 'numeral'
import type { FC } from 'react'

export type AmountCurrencyProps = {
  amount: number
  currencyCode?: string
}

export const AmountCurrency: FC<AmountCurrencyProps> = ({
  amount,
  currencyCode: code,
}) => {
  const space = useCurrentSpace()
  const currencyCode = code || space.baseCurrencyCode
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)
  const formatted = numeral(Math.abs(amount)).format('0,0[.]00')

  return (
    <span className={cn(amount > 0 && 'text-green-700')}>
      {currency?.symbolBefore && currency.symbol && (
        <span className="text-[0.85em] opacity-80">{currency.symbol}</span>
      )}
      <span>{formatted}</span>
      {!currency?.symbolBefore && currency?.symbol && (
        <span className="text-[0.85em] opacity-80">{currency.symbol}</span>
      )}
    </span>
  )
}
