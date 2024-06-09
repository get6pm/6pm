import { Tabs, TabsList, TabsTrigger } from '@/components/Tabs'
import { MoonStarIcon, SmartphoneIcon, SunIcon } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { ScrollView, Text } from 'react-native'

export default function AppearanceScreen() {
  const { colorScheme, setColorScheme } = useColorScheme()

  return (
    <ScrollView className="bg-card" contentContainerClassName="px-6 py-3">
      <Text className="font-sans text-primary font-medium text-base">
        App theme
      </Text>
      <Text className="font-sans text-muted-foreground text-sm mb-4">
        Choose a preferred theme for the 6pm
      </Text>
      <Tabs
        defaultValue={colorScheme || 'light'}
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onChange={(value: any) => setColorScheme(value)}
      >
        <TabsList>
          <TabsTrigger value="light" title="Light" icon={SunIcon} />
          <TabsTrigger value="dark" title="Dark" icon={MoonStarIcon} />
          <TabsTrigger value="system" title="System" icon={SmartphoneIcon} />
        </TabsList>
      </Tabs>
    </ScrollView>
  )
}
