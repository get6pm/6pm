import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { useClock } from '../ui/theme/clock';
import { moneyActions, type MoneyActions } from './money-actions';
import { createMoneyStore, dayOf, type MoneySnapshot, type MoneyStore } from './money-store';

const StoreContext = createContext<{ store: MoneyStore; actions: MoneyActions } | null>(null);

/**
 * Opens the money store on the encrypted database and keeps it on the phone's current day: it
 * reloads when the day turns over, so midnight starts a fresh Today without a relaunch.
 */
export function MoneyProvider({
  children,
  failed,
}: {
  readonly children: ReactNode;
  /** Drawn instead of the app when the first read fails; `retry` reads again. */
  readonly failed: (retry: () => void) => ReactNode;
}) {
  const db = useSQLiteContext();
  const { today } = useClock();
  const value = useMemo(() => {
    const store = createMoneyStore(db, today);
    return { store, actions: moneyActions(store) };
    // Made once per database; a new day reloads it below instead of making a new store.
  }, [db]);

  // No screen renders before the first read: a screen that fixes its data at mount (the close's
  // queue) must never see an empty store. The splash stays up until then; a read that fails lifts
  // it on a way to try again rather than leaving the splash up for good.
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    value.store.load(today).then(
      () => {
        setState('ready');
        SplashScreen.hide();
      },
      (error: unknown) => {
        Sentry.captureException(error);
        setState((s) => (s === 'ready' ? s : 'failed'));
        SplashScreen.hide();
      },
    );
  }, [value, today, attempt]);

  if (state === 'failed') {
    return failed(() => {
      setState('loading');
      setAttempt((n) => n + 1);
    });
  }
  return <StoreContext value={value}>{state === 'ready' ? children : null}</StoreContext>;
}

function useStore() {
  const value = use(StoreContext);
  if (!value) throw new Error('Money hooks need a MoneyProvider above them');
  return value;
}

export function useMoney(): MoneySnapshot {
  const { store } = useStore();
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  );
}

export function useMoneyActions(): MoneyActions & { reload: () => Promise<void> } {
  const { store, actions } = useStore();
  return useMemo(
    () => ({ ...actions, reload: () => store.load(store.getSnapshot().today) }),
    [store, actions],
  );
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keys = Object.keys(a) as (keyof T)[];
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
}

/**
 * Reads one part of the snapshot. The component renders again only when the selected value
 * changes (by `isEqual`, default `Object.is`), not on every write to the money database.
 */
export function useMoneySelector<T>(
  selector: (snapshot: MoneySnapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const { store } = useStore();
  const last = useRef<{
    snapshot: MoneySnapshot;
    selector: (snapshot: MoneySnapshot) => T;
    value: T;
  } | null>(null);
  const read = () => {
    const snapshot = store.getSnapshot();
    const previous = last.current;
    if (previous && previous.snapshot === snapshot && previous.selector === selector) {
      return previous.value;
    }
    const next = selector(snapshot);
    const value = previous && isEqual(previous.value, next) ? previous.value : next;
    last.current = { snapshot, selector, value };
    return value;
  };
  return useSyncExternalStore((listener) => store.subscribe(listener), read, read);
}

/**
 * Today's one number, or null before the month is set up. The same object comes back until the
 * number itself changes, so memoised children are not redrawn by unrelated writes.
 */
export function useDay() {
  return useMoneySelector(dayOf, (a, b) =>
    a === null || b === null ? a === b : shallowEqual(a, b),
  );
}

/** The store itself, for developer tools that write fixtures straight to the database. */
export function useMoneyStore(): MoneyStore {
  return useStore().store;
}
