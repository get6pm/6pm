import { MenuItem } from '@/components/common/menu-item'
import { useLocale } from '@/locales/provider'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { CheckIcon } from 'lucide-react-native'
import { ScrollView } from 'react-native'

export default function LanguageScreen() {
  const { i18n } = useLingui()
  const { language, setLanguage } = useLocale()
  const router = useRouter()

  return (
    <ScrollView className="bg-card">
      <MenuItem
        label={t(i18n)`English`}
        rightSection={
          language === 'en' && (
            <CheckIcon className="size-6 text-amount-positive" />
          )
        }
        onPress={() => {
          setLanguage('en')
          router.back()
        }}
      />
      <MenuItem
        label={t(i18n)`Vietnamese`}
        rightSection={
          language === 'vi' && (
            <CheckIcon className="size-6 text-amount-positive" />
          )
        }
        onPress={() => {
          setLanguage('vi')
          router.back()
        }}
      />
    </ScrollView>
  )
}
