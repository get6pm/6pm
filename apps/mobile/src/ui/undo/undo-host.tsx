import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import { haptics } from '../haptics';
import { useDesignInsets } from '../layout/design-insets';
import { UndoBar } from './undo-bar';

interface UndoOffer {
  readonly key: number;
  readonly text: string;
  readonly actionLabel: string;
  readonly undo: () => void;
}

const UNDO_MS = 5000;
/** Let go after holding it, the bar stays at least this long so the undo is still in reach. */
const AFTER_HOLD_MS = 1500;
const UndoContext = createContext<
  ((text: string, actionLabel: string, undo: () => void) => void) | null
>(null);

/**
 * The undo pill: "Deleted Phở Hòa · Undo", above the tab bar for five seconds. One at a time; a new
 * offer replaces the last (the last one's change stays). VoiceOver reads it as it appears; a finger
 * on it stops the clock, and a pull down puts it away.
 */
export function UndoHost({ children }: { readonly children: ReactNode }) {
  const { bottom } = useDesignInsets();
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const deadline = useRef(0);
  const remaining = useRef(UNDO_MS);
  const counter = useRef(0);
  // Whether a bar is up: a finger lifting off a bar that is already gone must not restart a clock.
  const showing = useRef(false);

  const arm = useCallback((ms: number) => {
    clearTimeout(timer.current);
    deadline.current = Date.now() + ms;
    timer.current = setTimeout(() => {
      showing.current = false;
      setOffer(null);
    }, ms);
  }, []);

  const show = useCallback(
    (text: string, actionLabel: string, undo: () => void) => {
      counter.current += 1;
      showing.current = true;
      setOffer({ key: counter.current, text, actionLabel, undo });
      AccessibilityInfo.announceForAccessibility(text);
      arm(UNDO_MS);
    },
    [arm],
  );

  const hold = useCallback(() => {
    clearTimeout(timer.current);
    remaining.current = Math.max(0, deadline.current - Date.now());
  }, []);
  const letGo = useCallback(() => {
    if (showing.current) arm(Math.max(remaining.current, AFTER_HOLD_MS));
  }, [arm]);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    showing.current = false;
    setOffer(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => show, [show]);

  return (
    <UndoContext value={value}>
      {children}
      {offer ? (
        <UndoBar
          key={offer.key}
          text={offer.text}
          actionLabel={offer.actionLabel}
          bottom={bottom(102)}
          onUndo={() => {
            haptics.tap();
            offer.undo();
            dismiss();
          }}
          onDismiss={dismiss}
          onHold={hold}
          onRelease={letGo}
        />
      ) : null}
    </UndoContext>
  );
}

/** Offers an undo for a change that has already been saved. */
export function useOfferUndo() {
  const show = use(UndoContext);
  if (!show) throw new Error('useOfferUndo needs an UndoHost above it');
  return show;
}
