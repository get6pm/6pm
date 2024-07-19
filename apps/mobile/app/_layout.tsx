import '../global.css'

import { tokenCache } from '@/lib/cache'
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import {
  BeVietnamPro_300Light,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro'
import { SplashScreen, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'

import 'react-native-reanimated'
import { ToastRoot } from '@/components/common/toast'
import { useWarmUpBrowser } from '@/hooks/use-warm-up-browser'
import { useColorScheme } from '@/hooks/useColorScheme'
import { queryClient } from '@/lib/client'
import { LocaleProvider } from '@/locales/provider'
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
import { useEffect } from 'react'
import { AppState, type AppStateStatus, Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Svg } from 'react-native-svg'

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

// biome-ignore lint/style/useNamingConvention: <explanation>
export const unstable_settings = {
  initialRouteName: '(app)',
}

export default function RootLayout() {
  useWarmUpBrowser()
  const { colorScheme } = useColorScheme()
  const [fontsLoaded] = useFonts({
    BeVietnamPro_300Light,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    // biome-ignore lint/style/useNamingConvention: <explanation>
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove()
  }, [])

  if (!fontsLoaded) {
    return null
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
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
        </PersistQueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  )
}
