import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect, SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'

export default function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => SplashScreen.hideAsync(), 1000)
    }
  }, [isLoaded])

  if (!isSignedIn && isLoaded) {
    return <Redirect href={'/login'} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="new-record"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          headerShown: true,
          headerBackTitleVisible: false,
          headerTintColor: theme[colorScheme ?? 'light'].primary,
          headerTitle: 'Appearance',
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Be Vietnam Pro Medium',
            fontSize: 16,
            color: theme[colorScheme ?? 'light'].primary,
          },
          headerStyle: {
            backgroundColor: theme[colorScheme ?? 'light'].background,
          }
        }}
      />
    </Stack>
  )
}
