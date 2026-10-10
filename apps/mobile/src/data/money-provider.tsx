import * as SplashScreen from 'expo-splash-screen';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useEffect,
  useMemo,
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
export function MoneyProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const { today } = useClock();
  const value = useMemo(() => {
    const store = createMoneyStore(db, today);
    return { store, actions: moneyActions(store) };
    // Made once per database; a new day reloads it below instead of making a new store.
  }, [db]);

  // No screen renders before the first read: a screen that fixes its data at mount (the close's
  // queue) must never see an empty store. The splash stays up until then.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void value.store.load(today).then(() => {
      setReady(true);
      SplashScreen.hide();
    });
  }, [value, today]);

  return <StoreContext value={value}>{ready ? children : null}</StoreContext>;
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

/** Today's one number, or null before the month is set up. */
export function useDay() {
  return dayOf(useMoney());
}

/** The store itself, for developer tools that write fixtures straight to the database. */
export function useMoneyStore(): MoneyStore {
  return useStore().store;
}
