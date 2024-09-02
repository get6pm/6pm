import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ExchangeRate = {
  fromCurrency: string
  toCurrency: string
  date: string
  rate: number
  rateDecimal: string
  [x: string]: string | number
}

interface ExchangeRatesStore {
  exchangeRates: ExchangeRate[]
  _reset: () => void
  setExchangeRates: (exchangeRates: ExchangeRate[]) => void
  updateExchangeRate: (exchangeRate: ExchangeRate) => void
}

export const useExchangeRatesStore = create<ExchangeRatesStore>()(
  persist(
    (set) => ({
      exchangeRates: [],
      // biome-ignore lint/style/useNamingConvention: <explanation>
      _reset: () => set({ exchangeRates: [] }),
      setExchangeRates: (exchangeRates: ExchangeRate[]) =>
        set({ exchangeRates }),
      updateExchangeRate: (exchangeRate: ExchangeRate) =>
        set((state) => {
          const index = state.exchangeRates.findIndex(
            (c) =>
              c.fromCurrency === exchangeRate.fromCurrency &&
              c.toCurrency === exchangeRate.toCurrency &&
              c.date === exchangeRate.date,
          )
          if (index === -1) {
            return {
              exchangeRates: [...state.exchangeRates, exchangeRate],
            }
          }

          state.exchangeRates[index] = exchangeRate
          return { exchangeRates: state.exchangeRates }
        }),
    }),
    {
      name: 'exchange-rates-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
