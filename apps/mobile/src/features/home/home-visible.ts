import { useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * The routes that take over the whole display (the `takeover` screens of the root layout, and
 * onboarding). Sheets are not here: Home stays visible, and alive, behind them.
 */
const COVERING_ROUTES: ReadonlySet<string> = new Set([
  'scan',
  'close',
  'max-welcome',
  'onboarding',
]);

/** A takeover fades in over Home; keep it moving until the fade is certainly done. */
const COVER_FADE_MS = 600;

/**
 * Whether Home is on screen right now, as a shared value for the UI thread: the app is in the
 * foreground and no full-screen takeover covers it. The sky and the companions run only while
 * this is true. It turns true at once when a takeover starts to leave, and false a moment after
 * one has finished arriving.
 */
export function useHomeVisible(): SharedValue<boolean> {
  const visible = useSharedValue(true);
  const segments: readonly string[] = useSegments();
  const first = segments[0];
  const covered = first !== undefined && COVERING_ROUTES.has(first);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state !== 'background');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (foreground && !covered) {
      visible.value = true;
      return undefined;
    }
    const timer = setTimeout(
      () => {
        visible.value = false;
      },
      foreground ? COVER_FADE_MS : 0,
    );
    return () => clearTimeout(timer);
  }, [visible, foreground, covered]);

  return visible;
}
