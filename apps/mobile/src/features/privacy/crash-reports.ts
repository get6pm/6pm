import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

import type { AiMode } from './ai-mode';

let allowed = true;
let started = false;

function dsn(): string | undefined {
  return process.env['EXPO_PUBLIC_SENTRY_DSN'];
}

/** Crash reports start only when a DSN is set; no money, names or notes are attached to them. */
function start(key: string): void {
  Sentry.init({
    dsn: key,
    environment: String(Constants.expoConfig?.extra?.['appVariant'] ?? 'dev'),
    sendDefaultPii: false,
    enabled: !__DEV__,
    // A report already on its way when on-device mode is chosen is dropped, not sent.
    beforeSend: (event) => (allowed ? event : null),
    beforeSendTransaction: (event) => (allowed ? event : null),
  });
  started = true;
}

/**
 * Crash reports follow the AI mode: on in server mode, off in on-device mode, where nothing about
 * the phone is sent. Called at launch with the mode known then, and whenever the mode changes:
 * switching to on-device mode closes the reporter (the native one too, so a crash is not sent at
 * the next launch), and switching back starts it again.
 */
export function applyAiModeToCrashReports(mode: AiMode): void {
  allowed = mode === 'server';
  const key = dsn();
  if (!key) return;
  if (allowed && !started) start(key);
  else if (!allowed && started) {
    started = false;
    void Sentry.close().catch(() => undefined);
  }
}

/** Whether crash reports are being sent now. */
export function crashReportsOn(): boolean {
  return started && allowed;
}
