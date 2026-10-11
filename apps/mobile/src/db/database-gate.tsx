import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { StartupError } from '../ui/startup-error';
import { DATABASE_NAME, prepareDatabase } from './database';
import { ensureDatabaseKey } from './database-key';

type Gate = 'key' | 'open' | 'failed';

/**
 * Opens the encrypted database for everything below it. The key is made sure of first (a file
 * restored from another iPhone is cleared then), and any failure to open shows a way to try again
 * instead of a crash or a splash that never lifts.
 */
export function DatabaseGate({ children }: { readonly children: ReactNode }) {
  const [gate, setGate] = useState<Gate>('key');
  // A new attempt remounts the provider, which opens the database again.
  const [attempt, setAttempt] = useState(0);

  const fail = useCallback((error: unknown) => {
    Sentry.captureException(error);
    SplashScreen.hide();
    setGate('failed');
  }, []);

  useEffect(() => {
    if (gate !== 'key') return;
    ensureDatabaseKey(DATABASE_NAME).then(() => setGate('open'), fail);
  }, [gate, fail]);

  if (gate === 'failed') {
    return (
      <StartupError
        onRetry={() => {
          setAttempt((n) => n + 1);
          setGate('key');
        }}
      />
    );
  }
  if (gate === 'key') return null;
  return (
    <SQLiteProvider
      key={attempt}
      databaseName={DATABASE_NAME}
      onInit={prepareDatabase}
      onError={fail}
    >
      {children}
    </SQLiteProvider>
  );
}
