import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
  type FrameInfo,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Whether the screen that holds a drawing is showing it right now: focused, not covered by a
 * full-screen takeover, the app in the foreground, and the page the person is on. A shared value
 * so a tab switch tells the UI thread without a React render. Nothing above means always showing.
 */
const ScreenActivityContext = createContext<SharedValue<boolean> | null>(null);

export function ScreenActivityProvider({
  active,
  children,
}: {
  readonly active: SharedValue<boolean>;
  readonly children: ReactNode;
}) {
  return <ScreenActivityContext value={active}>{children}</ScreenActivityContext>;
}

/** The shared flag of the screen around this component, or null when it is always showing. */
export function useScreenActivity(): SharedValue<boolean> | null {
  return use(ScreenActivityContext);
}

/**
 * The same flag as plain state, for work that lives on the JS thread (queries, timers). It
 * re-renders only the component that asks, and only when the screen starts or stops showing.
 */
export function useScreenActive(): boolean {
  const flag = use(ScreenActivityContext);
  const [active, setActive] = useState(true);
  useAnimatedReaction(
    () => (flag ? flag.value : true),
    (next, previous) => {
      if (next !== previous) runOnJS(setActive)(next);
    },
  );
  return active;
}

/**
 * A frame callback that runs only while `enabled` and the screen flag are both true, and is
 * really stopped otherwise (nothing wakes the UI thread for it). `callback` must be stable.
 */
export function useGatedFrameCallback(
  callback: (frame: FrameInfo) => void,
  enabled: boolean,
  gate: SharedValue<boolean> | null,
): void {
  const controller = useFrameCallback(callback, false);
  const setRunning = controller.setActive;
  const allowed = useSharedValue(enabled);
  useEffect(() => {
    allowed.value = enabled;
  }, [allowed, enabled]);
  useAnimatedReaction(
    () => allowed.value && (gate ? gate.value : true),
    (running, previous) => {
      if (running !== previous) runOnJS(setRunning)(running);
    },
  );
}
