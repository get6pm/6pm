import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MoneyProvider } from '../data/money-provider';
import { DATABASE_NAME, prepareDatabase } from '../db/database';
import { DevCommands } from '../features/dev/dev-commands';
import { I18nProvider } from '../i18n/i18n';
import { sheet, takeover } from '../ui/navigation/presentations';
import { ClockProvider } from '../ui/theme/clock';
import { ThemeProvider, useTheme } from '../ui/theme/theme';

// The splash stays until the encrypted database is open and migrated: no screen ever renders
// without its data, so there is never a blank or half-drawn first frame.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 280, fade: true });

function Screens() {
  const { palette } = useTheme();
  return (
    <>
      <StatusBar style={palette.dark ? 'light' : 'dark'} animated />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.sheetSolid },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={sheet} />
        <Stack.Screen name="quick-add" options={sheet} />
        <Stack.Screen name="scan" options={takeover} />
        <Stack.Screen name="inbox" options={sheet} />
        <Stack.Screen name="close" options={takeover} />
        <Stack.Screen name="(dev)/tools" options={sheet} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={prepareDatabase}>
        <I18nProvider>
          <ClockProvider>
            <MoneyProvider>
              <ThemeProvider>
                <Screens />
                {__DEV__ ? <DevCommands /> : null}
              </ThemeProvider>
            </MoneyProvider>
          </ClockProvider>
        </I18nProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
