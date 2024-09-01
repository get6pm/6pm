import { getHonoClient } from '@/lib/client'
import type { CreateUser } from '@6pm/validation'
import { getLocales } from 'expo-localization'

export async function createUser(data: CreateUser) {
  const hc = await getHonoClient()
  const deviceLanguage = getLocales()[0].languageCode ?? 'vi'
  const deviceCurrency = getLocales()[0]?.currencyCode ?? 'VND'

  await hc.v1.users.$post({
    json: data,
    header: {
      'x-device-language': deviceLanguage,
      'x-device-currency': deviceCurrency,
    },
  })
}
