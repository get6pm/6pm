import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import { FeatureFlag, useFeatureFlag } from '@/hooks/use-feature-flag'
import { useUserEntitlements } from '@/hooks/use-purchases'
import { useColorScheme } from '@/hooks/useColorScheme'
import { Palette, themeVariables } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { LockKeyholeIcon, MoonStarIcon, SunIcon } from 'lucide-react-native'
import { vars } from 'nativewind'
import { ScrollView, StatusBar, View, useWindowDimensions } from 'react-native'

export default function AppearanceScreen() {
  const { colorScheme, setColorScheme } = useColorScheme()
  const { i18n } = useLingui()
  const { preferredPalette, setPreferredPalette } = useUserSettingsStore()
  const width = useWindowDimensions().width
  const { isPro } = useUserEntitlements()
  const router = useRouter()
  const isDynamicColorPaletteEnabled = useFeatureFlag(
    FeatureFlag.DynamicColorPalette,
  )

  const palettes = [
    {
      id: Palette.Default,
      label: t(i18n)`Default`,
      themeVariables: themeVariables[Palette.Default][colorScheme],
      pro: false,
    },
    {
      id: Palette.TokyoNight,
      label: t(i18n)`Tokyo Night`,
      themeVariables: themeVariables[Palette.TokyoNight][colorScheme],
      pro: true,
    },
    {
      id: Palette.WinterIsComing,
      label: t(i18n)`Winter is coming`,
      themeVariables: themeVariables[Palette.WinterIsComing][colorScheme],
      pro: true,
    },
    {
      id: Palette.Catppuccin,
      label: t(i18n)`Catppuccin`,
      themeVariables: themeVariables[Palette.Catppuccin][colorScheme],
      pro: true,
    },
    {
      id: Palette.RosePine,
      label: t(i18n)`Rosé Pine`,
      themeVariables: themeVariables[Palette.RosePine][colorScheme],
      pro: true,
    },
  ]

  return (
    <ScrollView className="bg-background" contentContainerClassName="px-6 py-3">
      <Text className="font-medium text-base text-foreground">
        {t(i18n)`App theme`}
      </Text>
      <Text className="mb-4 text-muted-foreground text-sm">
        {t(i18n)`Toggle between light and dark mode`}
      </Text>
      <Tabs
        value={colorScheme || 'light'}
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        onValueChange={(value: any) => {
          setColorScheme(value)
          if (value === 'dark') {
            StatusBar.setBarStyle('light-content')
          } else {
            StatusBar.setBarStyle('dark-content')
          }
        }}
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
      {isDynamicColorPaletteEnabled && (
        <>
          <Text className="mt-8 font-medium text-base text-foreground">
            {t(i18n)`Color palette`}
          </Text>
          <Text className="mb-4 text-muted-foreground text-sm">
            {t(i18n)`Choose a preferred color palette for 6pm`}
          </Text>
          <View className="flex-row flex-wrap gap-4">
            {palettes.map((palette) => (
              <View key={palette.id} style={vars(palette.themeVariables)}>
                <Button
                  variant={'outline'}
                  size="lg"
                  className={cn(
                    '!border-2 !h-32 rounded-xl p-1 active:bg-background',
                    palette.id === preferredPalette && '!border-primary',
                  )}
                  onPress={() => {
                    if (palette.pro && !isPro) {
                      Haptics.selectionAsync()
                      router.push('/paywall')
                      return
                    }
                    setPreferredPalette(palette.id)
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    )
                  }}
                  style={{ width: (width - 12 * 4) / 2 - 4 }}
                >
                  <View className="h-full flex-1 items-center justify-center rounded-md bg-background">
                    <Text className="!text-5xl !text-primary mb-2 font-semiBold">
                      Aa
                    </Text>
                  </View>
                  <View className="absolute right-1 bottom-1 left-1 w-full rounded-b-md bg-muted py-1">
                    <Text className="!text-sm text-center font-medium text-foreground uppercase">
                      {palette.label}
                    </Text>
                  </View>

                  {palette.pro && !isPro && (
                    <Badge
                      variant="secondary"
                      className="absolute top-1 right-1 rounded-lg py-1.5"
                    >
                      <LockKeyholeIcon className="size-4 text-primary" />
                    </Badge>
                  )}
                </Button>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}
