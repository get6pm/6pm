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
      <Text className="font-medium font-sans text-base text-primary">
        {t(i18n)`App theme`}
      </Text>
      <Text className="mb-4 font-sans text-muted-foreground text-sm">
        {t(i18n)`Choose a preferred theme for the 6pm`}
      </Text>
      <Tabs
        value={colorScheme || 'light'}
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onValueChange={(value: any) => setColorScheme(value)}
      >
        <TabsList>
          <TabsTrigger value="light">
            <SunIcon className="h-5 w-5 text-muted-foreground" />
            <Text>{t(i18n)`Light`}</Text>
          </TabsTrigger>
          <TabsTrigger value="dark">
            <MoonStarIcon className="h-5 w-5 text-muted-foreground" />
            <Text>{t(i18n)`Dark`}</Text>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </ScrollView>
  )
}
