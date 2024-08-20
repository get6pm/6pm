import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/vi'

import '../global.css'

import * as Sentry from '@sentry/react-native'
import { isRunningInExpoGo } from 'expo'

import { tokenCache } from '@/lib/cache'
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import {
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter'
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono'
import * as Notifications from 'expo-notifications'
import { SplashScreen, Stack, useNavigationContainerRef } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

import 'react-native-reanimated'
import { ToastRoot } from '@/components/common/toast'
import { useNotificationObserver } from '@/hooks/use-schedule-notification'
import { useWarmUpBrowser } from '@/hooks/use-warm-up-browser'
import { useColorScheme } from '@/hooks/useColorScheme'
import { queryClient } from '@/lib/client'
import { LocaleProvider } from '@/locales/provider'
import { StoreProvider } from '@/stores/store-provider'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { focusManager, onlineManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { LinearGradient } from 'expo-linear-gradient'
import { cssInterop } from 'nativewind'
import { PostHogProvider } from 'posthog-react-native'
import { useEffect } from 'react'
import { AppState, type AppStateStatus, Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Svg } from 'react-native-svg'

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
const routingInstrumentation = new Sentry.ReactNavigationInstrumentation()

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // debug: true,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
    }),
  ],
})

// Online status management
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

cssInterop(Svg, {
  className: {
    target: 'style',
    nativeStyleToProp: { width: true, height: true },
  },
})
cssInterop(LinearGradient, {
  className: {
    target: 'style',
  },
})

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

WebBrowser.maybeCompleteAuthSession()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

// biome-ignore lint/style/useNamingConvention: <explanation>
export const unstable_settings = {
  initialRouteName: '(app)',
}

function RootLayout() {
  useWarmUpBrowser()
  const { colorScheme } = useColorScheme()
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  })
  const ref = useNavigationContainerRef()
  useNotificationObserver()

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref)
    }
  }, [ref])

  if (!fontsLoaded) {
    return null
  }

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST!,
      }}
      autocapture
    >
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <StoreProvider>
              <LocaleProvider>
                <ThemeProvider
                  value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
                >
                  <SafeAreaProvider>
                    <GestureHandlerRootView>
                      <BottomSheetModalProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen
                            name="(aux)"
                            options={{
                              presentation: 'modal',
                            }}
                          />
                        </Stack>
                        <ToastRoot />
                        <PortalHost />
                      </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </ThemeProvider>
              </LocaleProvider>
            </StoreProvider>
          </PersistQueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </PostHogProvider>
  )
}

export default Sentry.wrap(RootLayout)
