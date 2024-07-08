import { BackButton } from '@/components/common/back-button'
import { Button } from '@/components/ui/button'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useAuth } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, Redirect, SplashScreen, Stack } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useEffect } from 'react'

export default function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => SplashScreen.hideAsync(), 1000)
    }
  }, [isLoaded])

  if (!isSignedIn && isLoaded) {
    return <Redirect href={'/login'} />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: theme[colorScheme ?? 'light'].primary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Be Vietnam Pro Medium',
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
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new-record"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="language"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`Language`,
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{ headerTitle: t(i18n)`Appearance` }}
      />
      <Stack.Screen
        name="wallet/accounts"
        options={{
          headerTitle: t(i18n)`Wallet accounts`,
          headerRight: () => (
            <Link href="/wallet/new-account" asChild>
              <Button size="icon" variant="ghost">
                <PlusIcon className="size-6 text-primary" />
              </Button>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="wallet/new-account"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`New account`,
        }}
      />
      <Stack.Screen
        name="wallet/[walletId]"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`Edit account`,
        }}
      />
      <Stack.Screen
        name="category/index"
        options={{
          headerTitle: t(i18n)`Categories`,
          headerRight: () => (
            <Link href="/category/new-category" asChild>
              <Button size="icon" variant="ghost">
                <PlusIcon className="size-6 text-primary" />
              </Button>
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="category/new-category"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`New category`,
        }}
      />
      <Stack.Screen
        name="category/[categoryId]"
        options={{
          // presentation: 'modal',
          headerTitle: t(i18n)`Edit category`,
        }}
      />
    </Stack>
  )
}
