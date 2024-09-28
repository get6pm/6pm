import { dayjsExtended } from '@6pm/utilities'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { Text } from 'react-native'
import { messages as enMessages } from './en/messages'
import { messages as viMessages } from './vi/messages'

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en'
const defaultLanguage = ['en', 'vi'].includes(deviceLanguage)
  ? deviceLanguage
  : 'en'

dayjsExtended.locale(defaultLanguage)

const messages = {
  en: enMessages,
  vi: viMessages,
}

i18n.load(messages)
i18n.activate(defaultLanguage)

export const LocaleContext = createContext<{
  language: string
  setLanguage: (language: string) => void
}>({
  language: defaultLanguage,
  // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
  setLanguage: () => {},
})

export function LocaleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [language, setLanguage] = useState<string>(defaultLanguage)

  useLayoutEffect(() => {
    async function main() {
      const persistedLanguage = await AsyncStorage.getItem(
        '@preferred_language',
      )
      if (persistedLanguage) {
        setLanguage(persistedLanguage)
      }
    }
    main()
  }, [])

  useEffect(() => {
    async function main() {
      i18n.activate(language)
      await AsyncStorage.setItem('@preferred_language', language)
    }
    main()
  }, [language])

  return (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    <I18nProvider i18n={i18n} defaultComponent={Text as any}>
      <LocaleContext.Provider value={{ language, setLanguage }}>
        {children}
      </LocaleContext.Provider>
    </I18nProvider>
  )
}

export function useLocale() {
  const { language, setLanguage } = useContext(LocaleContext)
  return { language, setLanguage }
}
