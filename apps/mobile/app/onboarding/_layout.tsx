import { BackButton } from '@/components/common/back-button'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  const { colorScheme } = useColorScheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme[colorScheme ?? 'light'].background,
        },
        headerShadowVisible: false,
        headerLeft: () => <BackButton />,
        headerTitle: '',
      }}
    >
      <Stack.Screen
        name="step-one"
        options={{
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="step-two"
        options={{
          headerStyle: {
            backgroundColor: theme[colorScheme ?? 'light'].muted,
          },
        }}
      />
      <Stack.Screen name="step-three" />
    </Stack>
  )
}
