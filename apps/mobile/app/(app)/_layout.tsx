import { AuthLocal } from '@/components/auth/auth-local'
import { BackButton } from '@/components/common/back-button'
import { Button } from '@/components/ui/button'
import { useLocalAuth } from '@/hooks/use-local-auth'
import { useScheduleNotificationTrigger } from '@/hooks/use-schedule-notification'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, Redirect, SplashScreen, Stack } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { useEffect } from 'react'

export default function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useUser()
  const { onboardedAt } = useUserMetadata()
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  const { shouldAuthLocal, setShouldAuthLocal } = useLocalAuth()
  useScheduleNotificationTrigger()

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => SplashScreen.hideAsync(), 1000)
    }
  }, [isLoaded])

  if (!isSignedIn && isLoaded) {
    return <Redirect href={'/login'} />
  }

  if (!onboardedAt && isLoaded) {
    return <Redirect href={'/onboarding/step-one'} />
  }

  if (shouldAuthLocal) {
    return <AuthLocal onAuthenticated={() => setShouldAuthLocal(false)} />
  }

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
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transaction/new-record"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transaction/[transactionId]"
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
        name="profile"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`Profile`,
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
          presentation: 'modal',
          headerTitle: t(i18n)`Edit category`,
        }}
      />
      <Stack.Screen
        name="budget/new-budget"
        options={{
          presentation: 'modal',
          headerTitle: t(i18n)`New budget`,
        }}
      />
    </Stack>
  )
}
