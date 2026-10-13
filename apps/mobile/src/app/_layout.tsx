import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MoneyProvider, useMoney } from '../data/money-provider';
import { DatabaseGate } from '../db/database-gate';
import { BackupHost } from '../features/backup/backup-host';
import { CloseNudge } from '../features/companion/close-nudge';
import { DevCommands } from '../features/dev/dev-commands';
import { CloseReminderSync } from '../features/reminders/close-reminder-sync';
import { ReminderTap } from '../features/reminders/reminder-tap';
import { SurfacesSync } from '../features/surfaces/surfaces-sync';
import { LookSettingsProvider, useThemeLook } from '../features/looks/look-settings-provider';
import { MemberCompanionForm } from '../features/purchases/member-companion-form';
import { PurchasesProvider } from '../features/purchases/purchases-provider';
import { TravelProvider } from '../features/travel/travel-provider';
import { I18nProvider } from '../i18n/i18n';
import { drawnSheet, sheet, takeover } from '../ui/navigation/presentations';
import { ClockProvider } from '../ui/theme/clock';
import { ThemeProvider, useTheme } from '../ui/theme/theme';
import { StartupError } from '../ui/startup-error';
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
        <Stack.Screen name="capture-guide" options={sheet} />
        <Stack.Screen name="categories" options={sheet} />
        <Stack.Screen name="quick-add" options={sheet} />
        <Stack.Screen name="scan" options={takeover} />
        <Stack.Screen name="ask" options={takeover} />
        <Stack.Screen name="inbox" options={sheet} />
        <Stack.Screen name="close" options={takeover} />
        <Stack.Screen name="spend/[id]" options={sheet} />
        <Stack.Screen name="missed-day" options={drawnSheet} />
        <Stack.Screen name="money-diary" options={sheet} />
        <Stack.Screen name="new-pot" options={sheet} />
        <Stack.Screen name="pot/[id]" options={sheet} />
        <Stack.Screen name="bill/[id]" options={sheet} />
        <Stack.Screen name="month" options={sheet} />
        <Stack.Screen name="looks" options={sheet} />
        <Stack.Screen name="look/[id]" options={drawnSheet} />
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
      <DatabaseGate>
        <PurchasesProvider>
          <MemberCompanionForm>
            <LookSettingsProvider>
              <I18nProvider>
                <ClockProvider>
                  <MoneyProvider failed={(retry) => <StartupError onRetry={retry} />}>
                    <TravelProvider>
                      <PlanTheme>
                        <ToastHost>
                          <UndoHost>
                            <Screens />
                          </UndoHost>
                          <CloseNudge />
                          <CloseReminderSync />
                          <ReminderTap />
                          <BackupHost />
                          <SurfacesSync />
                          {__DEV__ ? <DevCommands /> : null}
                        </ToastHost>
                      </PlanTheme>
                    </TravelProvider>
                  </MoneyProvider>
                </ClockProvider>
              </I18nProvider>
            </LookSettingsProvider>
          </MemberCompanionForm>
        </PurchasesProvider>
      </DatabaseGate>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
