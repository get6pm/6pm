import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MoneyProvider, useMoney } from '../data/money-provider';
import { DATABASE_NAME, prepareDatabase } from '../db/database';
import { BackupHost } from '../features/backup/backup-host';
import { CloseNudge } from '../features/companion/close-nudge';
import { DevCommands } from '../features/dev/dev-commands';
import { LookSettingsProvider, useThemeLook } from '../features/looks/look-settings-provider';
import { PurchasesProvider } from '../features/purchases/purchases-provider';
import { I18nProvider } from '../i18n/i18n';
import { sheet, takeover } from '../ui/navigation/presentations';
import { ClockProvider } from '../ui/theme/clock';
import { ThemeProvider, useTheme } from '../ui/theme/theme';
import { ToastHost } from '../ui/toast/toast-host';
import { UndoHost } from '../ui/undo/undo-host';

// The splash stays until the encrypted database is open and migrated: no screen ever renders
// without its data, so there is never a blank or half-drawn first frame.
void SplashScreen.preventAutoHideAsync();

// Crash reports start only when a DSN is set; no money, names or notes are attached to them.
const sentryDsn = process.env['EXPO_PUBLIC_SENTRY_DSN'];
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: String(Constants.expoConfig?.extra?.['appVariant'] ?? 'dev'),
    sendDefaultPii: false,
    enabled: !__DEV__,
  });
}
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
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="settings" options={sheet} />
        <Stack.Screen name="categories" options={sheet} />
        <Stack.Screen name="quick-add" options={sheet} />
        <Stack.Screen name="scan" options={takeover} />
        <Stack.Screen name="inbox" options={sheet} />
        <Stack.Screen name="close" options={takeover} />
        <Stack.Screen name="spend/[id]" options={sheet} />
        <Stack.Screen name="missed-day" options={sheet} />
        <Stack.Screen name="money-diary" options={sheet} />
        <Stack.Screen name="new-pot" options={sheet} />
        <Stack.Screen name="looks" options={sheet} />
        <Stack.Screen name="look/[id]" options={sheet} />
        <Stack.Screen name="max" options={sheet} />
        <Stack.Screen name="max-welcome" options={takeover} />
        <Stack.Screen name="backup" options={sheet} />
        <Stack.Screen name="(dev)/tools" options={sheet} />
      </Stack>
    </>
  );
}

/**
 * The theme follows the plan and the look: serious mode set in Settings turns the whole app plain
 * at once, and a look being tried on dresses the whole app, not just its preview.
 */
function PlanTheme({ children }: { readonly children: ReactNode }) {
  const { plan } = useMoney();
  const themeLook = useThemeLook();
  return (
    <ThemeProvider {...themeLook} serious={plan?.serious ?? false}>
      {children}
    </ThemeProvider>
  );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={prepareDatabase}>
        <PurchasesProvider>
          <LookSettingsProvider>
            <I18nProvider>
              <ClockProvider>
                <MoneyProvider>
                  <PlanTheme>
                    <ToastHost>
                      <UndoHost>
                        <Screens />
                      </UndoHost>
                      <CloseNudge />
                      <BackupHost />
                      {__DEV__ ? <DevCommands /> : null}
                    </ToastHost>
                  </PlanTheme>
                </MoneyProvider>
              </ClockProvider>
            </I18nProvider>
          </LookSettingsProvider>
        </PurchasesProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
