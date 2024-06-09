import { Tabs, TabsList, TabsTrigger } from '@/components/Tabs'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { MoonStarIcon, SmartphoneIcon, SunIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { ScrollView, Text } from 'react-native'

export default function AppearanceScreen() {
  const { colorScheme, setColorScheme } = useColorScheme()
  const { i18n } = useLingui()

  return (
    <ScrollView className="bg-card" contentContainerClassName="px-6 py-3">
      <Text className="font-sans text-primary font-medium text-base">
        {t(i18n)`App theme`}
      </Text>
      <Text className="font-sans text-muted-foreground text-sm mb-4">
        {t(i18n)`Choose a preferred theme for the 6pm`}
      </Text>
      <Tabs
        defaultValue={colorScheme || 'light'}
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onChange={(value: any) => setColorScheme(value)}
      >
        <TabsList>
          <TabsTrigger
            value="light"
            title={t(i18n)`Light`}
            icon={SunIcon}
          />
          <TabsTrigger
            value="dark"
            title={t(i18n)`Dark`}
            icon={MoonStarIcon}
          />
          <TabsTrigger
            value="system"
            title={t(i18n)`System`}
            icon={SmartphoneIcon}
          />
        </TabsList>
      </Tabs>
    </ScrollView>
  )
}
