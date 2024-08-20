import { BackButton } from '@/components/common/back-button'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Stack } from 'expo-router'

export default function AuxiliaryLayout() {
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: theme[colorScheme ?? 'light'].primary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Inter Medium',
          fontSize: 16,
          color: theme[colorScheme ?? 'light'].primary,
        },
        headerStyle: {
          backgroundColor: theme[colorScheme ?? 'light'].background,
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
  )
}
