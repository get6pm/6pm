import '../global.css'

import { tokenCache } from '@/lib/cache'
import { ClerkProvider } from '@clerk/clerk-expo'
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
import { useWarmUpBrowser } from '@/hooks/use-warm-up-browser'
import { useColorScheme } from '@/hooks/useColorScheme'
import { queryClient } from '@/lib/client'
import { LocaleProvider } from '@/locales/provider'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import { cssInterop } from 'nativewind'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Svg } from 'react-native-svg'

cssInterop(Svg, {
  className: {
    target: 'style',
    nativeStyleToProp: { width: true, height: true },
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

  if (!fontsLoaded) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        tokenCache={tokenCache}
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
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </ThemeProvider>
        </LocaleProvider>
      </ClerkProvider>
    </QueryClientProvider>
  )
}
