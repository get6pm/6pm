import { getLocales } from 'expo-localization'
import { useUserSettingsStore } from './store'

const deviceCurrency = getLocales()[0]?.currencyCode

export function useDefaultCurrency() {
  const { preferredCurrency } = useUserSettingsStore()

  return preferredCurrency || deviceCurrency || 'USD'
}
