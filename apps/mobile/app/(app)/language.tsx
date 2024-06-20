import { MenuItem } from '@/components/common/menu-item'
import { useLocale } from '@/locales/provider'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { CheckCircleIcon } from 'lucide-react-native'
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
            <CheckCircleIcon className="w-5 h-5 text-primary" />
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
            <CheckCircleIcon className="w-5 h-5 text-primary" />
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
