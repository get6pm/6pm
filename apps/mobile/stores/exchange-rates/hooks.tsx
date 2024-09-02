import { useQuery } from '@tanstack/react-query'
import { exchangeRatesQueries } from './queries'
import { useExchangeRatesStore } from './store'

export function useExchangeRate({
  fromCurrency,
  toCurrency,
  date,
}: {
  fromCurrency: string
  toCurrency: string
  date?: string
}) {
  const { exchangeRates, updateExchangeRate } = useExchangeRatesStore()

  const { data, isLoading } = useQuery({
    ...exchangeRatesQueries.detail({
      fromCurrency,
      toCurrency,
      date,
      updateExchangeRate,
    }),
    initialData: exchangeRates.find(
      (e) =>
        e.fromCurrency === fromCurrency &&
        e.toCurrency === toCurrency &&
        e.date === date,
    ),
    enabled: fromCurrency !== toCurrency,
  })

  return {
    exchangeRate: data,
    isLoading,
  }
}
