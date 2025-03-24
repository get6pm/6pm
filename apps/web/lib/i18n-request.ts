import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const SUPPORTED_LOCALES = ['en', 'vi']

export default getRequestConfig(async () => {
  const c = await cookies()
  let locale = c.get('locale')?.value || 'en'

  if (!SUPPORTED_LOCALES.includes(locale)) {
    locale = 'en' // fallback to default locale
    c.set('locale', locale)
  }

  const messages = (await import(`../../../packages/locales/${locale}.json`))
    .default

  return {
    locale,
    messages,
  }
})
