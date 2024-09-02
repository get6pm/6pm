import { getHonoClient } from '@/lib/client'
import { createQueryKeys } from '@lukemorales/query-key-factory'
import type { ExchangeRate } from './store'

export const exchangeRatesQueries = createQueryKeys('exchange-rates', {
  detail: ({
    fromCurrency,
    toCurrency,
    date,
    updateExchangeRate,
  }: {
    fromCurrency: string
    toCurrency: string
    date?: string
    updateExchangeRate: (exchangeRate: ExchangeRate) => void
  }) => ({
    queryKey: [fromCurrency, toCurrency, date],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1['exchange-rates'][':fromCurrency'][
        ':toCurrency'
      ].$get({
        param: { fromCurrency, toCurrency },
        query: { date },
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }

      const result = await res.json()
      if (result.date) {
        updateExchangeRate({
          date: result.date,
          fromCurrency: result.fromCurrency,
          toCurrency: result.toCurrency,
          rate: result.rate,
          rateDecimal: result.rate.toString(),
          [result.fromCurrency]: 1,
          [result.toCurrency]: result.rate,
        })
      }

      return result
    },
  }),
})
