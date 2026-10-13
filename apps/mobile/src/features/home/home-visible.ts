import { useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * Home is the root route. Anything pushed over it hides it: a full-screen takeover owns the whole
 * display, and a sheet leaves only a dimmed strip of it at the top, so nothing there needs to move
 * while the person reads or scrolls the sheet.
 */
export function coversHome(segments: readonly string[]): boolean {
  const first = segments[0];
  return first !== undefined && first !== 'index';
}

/**
 * A takeover fades in and a sheet slides up over Home; keep Home moving until either has
 * certainly arrived, so it is never seen stopping.
 */
const COVER_ARRIVE_MS = 600;

/**
 * Whether Home is on screen right now, as a shared value for the UI thread: the app is in the
 * foreground and no other route is over it. The sky and the companions run only while this is
 * true; while it is false they hold their last frame, so nothing blanks or jumps. It turns true
 * at once when the route over Home leaves, and false a moment after one has finished arriving.
 */
export function useHomeVisible(): SharedValue<boolean> {
  const visible = useSharedValue(true);
  const segments: readonly string[] = useSegments();
  const covered = coversHome(segments);
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
      foreground ? COVER_ARRIVE_MS : 0,
    );
    return () => clearTimeout(timer);
  }, [visible, foreground, covered]);

  return visible;
}
