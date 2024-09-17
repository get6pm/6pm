import { BackButton } from '@/components/common/back-button'
import { useColorPalette } from '@/hooks/use-color-palette'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  const { getColor } = useColorPalette()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: getColor('--background'),
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
            backgroundColor: getColor('--muted'),
          },
        }}
      />
      <Stack.Screen name="step-three" />
    </Stack>
  )
}
