import { BackButton } from '@/components/common/back-button'
import { useColorPalette } from '@/hooks/use-color-palette'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native'

export default function AuxiliaryLayout() {
  const { getColor } = useColorPalette()

  const { i18n } = useLingui()
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitleVisible: false,
          headerTintColor: getColor('--foreground'),
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Haskoy-SemiBold',
            fontSize: 16,
            color: getColor('--foreground'),
          },
          headerStyle: {
            backgroundColor: getColor('--background'),
          },
          headerLeft: () => <BackButton />,
        }}
      >
        <Stack.Screen
          name="privacy-policy"
          options={{
            presentation: 'modal',
            headerTitle: t(i18n)`Privacy Policy`,
          }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{
            presentation: 'modal',
            headerTitle: t(i18n)`Terms & Conditions`,
          }}
        />
      </Stack>
    </SafeAreaView>
  )
}
