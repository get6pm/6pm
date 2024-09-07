import { AuthLocal } from '@/components/auth/auth-local'
import { BackButton } from '@/components/common/back-button'
import { useLocalAuth } from '@/hooks/use-local-auth'
import { useScheduleNotificationTrigger } from '@/hooks/use-schedule-notification'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Redirect, SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'

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

  return (
    <View className="flex-1">
      {shouldAuthLocal && (
        <AuthLocal onAuthenticated={() => setShouldAuthLocal(false)} />
      )}
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
            headerTitle: '',
            headerStyle: {
              backgroundColor: theme[colorScheme ?? 'light'].muted,
            },
            // headerShown: false,
          }}
        />
        <Stack.Screen
          name="review-transactions"
          options={{
            headerTitle: t(i18n)`Review transactions`,
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
          name="feedback"
          options={{
            presentation: 'modal',
            headerTitle: t(i18n)`Feedback`,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            headerTitle: '',
          }}
        />
        <Stack.Screen
          name="appearance"
          options={{ headerTitle: t(i18n)`Appearance` }}
        />
        <Stack.Screen
          name="app-icon"
          options={{ headerTitle: t(i18n)`App icon` }}
        />
        <Stack.Screen
          name="wallet/accounts"
          options={{
            headerTitle: t(i18n)`Wallet accounts`,
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
    </View>
  )
}
