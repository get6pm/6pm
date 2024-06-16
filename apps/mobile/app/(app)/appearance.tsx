import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { MoonStarIcon, SunIcon } from 'lucide-react-native'
import { ScrollView } from 'react-native'

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
        value={colorScheme || 'light'}
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onValueChange={(value: any) => setColorScheme(value)}
      >
        <TabsList>
          <TabsTrigger value="light">
            <SunIcon className="w-5 h-5 text-muted-foreground" />
            <Text>{t(i18n)`Light`}</Text>
          </TabsTrigger>
          <TabsTrigger value="dark">
            <MoonStarIcon className="w-5 h-5 text-muted-foreground" />
            <Text>{t(i18n)`Dark`}</Text>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </ScrollView>
  )
}
