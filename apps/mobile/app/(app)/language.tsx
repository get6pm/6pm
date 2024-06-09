import { MenuItem } from '@/components/common/menu-item'
import { useLocale } from '@/locales/provider'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { CheckCircleIcon } from 'lucide-react-native'
import { ScrollView, Text } from 'react-native'

export default function LanguageScreen() {
  const { i18n } = useLingui()
  const { language, setLanguage } = useLocale()
  const router = useRouter()

  return (
    <ScrollView className="bg-card">
      <Text className="font-sans font-medium text-primary text-lg m-6 mx-auto">
        {t(i18n)`Language`}
      </Text>
      <MenuItem
        label={t(i18n)`English`}
        rightSection={language === 'en' && <CheckCircleIcon className='w-5 h-5 text-primary' />}
        onPress={() => {
          setLanguage('en')
          router.back()
        }}
      />
      <MenuItem
        label={t(i18n)`Vietnamese`}
        rightSection={language === 'vi' && <CheckCircleIcon className='w-5 h-5 text-primary' />}
        onPress={() => {
          setLanguage('vi')
          router.back()
        }}
      />
    </ScrollView>
  )
}
