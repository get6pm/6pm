import * as Sentry from '@sentry/react-native';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import type { TogetherState } from '@6pm/domain';

import { useMoneyStore } from '../../data/money-provider';
import { reconcileTogetherMoves } from '../../data/together-moves';
import { useI18n } from '../../i18n/i18n';
import { useToast } from '../../ui/toast/toast-host';
import { homeCurrencyOf } from '../../money/use-money-format';
import { useApi } from '../api/native-api';
import { sha256Hex, signInWithApple } from './apple-sign-in';
import { createTogetherApi, type TogetherApi } from './together-api';
import { inHomeFor } from './together-home';
import {
  parseTogetherCache,
  SIGNED_OUT,
  TOGETHER_CACHE_KEY,
  type TogetherOp,
} from './together-state';
import {
  createTogetherSync,
  type RunResult,
  type TogetherSnapshot,
  type TogetherSync,
} from './together-sync';

export interface TogetherValue {
  readonly sync: TogetherSync;
  readonly api: TogetherApi;
  /** Apple's sheet, then the server: throws `SignInCancelled` when the person closes it. */
  readonly signIn: () => Promise<TogetherState>;
  readonly run: (op: TogetherOp) => Promise<RunResult>;
  readonly leave: () => Promise<void>;
  readonly deleteAccount: () => Promise<void>;
}

const TogetherContext = createContext<TogetherValue | null>(null);

/**
 * Budget together for the whole app. The last known shared copy is read at launch, so the Plan
 * card is right in the first frame; a phone that is signed in asks the server again on launch
 * and every time the app comes back. A phone that never started Budget together never calls.
 */
export function TogetherProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const client = useApi();
  const store = useMoneyStore();
  const toast = useToast();
  const { t } = useI18n();
  const say = useRef({ toast, t });
  say.current = { toast, t };

  const value = useMemo<TogetherValue>(() => {
    const api = createTogetherApi(client);
    const kept = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
      TOGETHER_CACHE_KEY,
    ])?.value;
    // Counted money changed: the daily number is worked out again.
    const recount = (changed: () => Promise<number | boolean>) =>
      store.exclusive(async () => {
        if (await changed()) await store.loadInTurn(store.getSnapshot().today);
      });
    const sync = createTogetherSync(
      {
        api,
        persist: async (state) => {
          await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
            TOGETHER_CACHE_KEY,
            JSON.stringify(state),
          ]);
        },
        history: {
          reconcile: (entries, livePotIds) =>
            recount(() =>
              reconcileTogetherMoves(
                store.db,
                entries,
                livePotIds,
                store.getSnapshot().plan?.payday ?? { kind: 'lastDay' },
                inHomeFor(store.db, client, homeCurrencyOf(store.getSnapshot().plan)),
              ),
            ),
        },
        onEnded: () => say.current.toast(say.current.t('together.ended')),
        onLocalError: (error) => Sentry.captureException(error),
      },
      parseTogetherCache(kept),
    );
    const signedOutBy = (next: TogetherState) => sync.adopt(next);
    return {
      sync,
      api,
      signIn: async () => {
        // A single-use nonce from the server: Apple signs its hash into the token.
        const nonce = await api.createNonce();
        const credential = await signInWithApple(await sha256Hex(nonce));
        const next = await api.signIn(credential, nonce);
        sync.adopt(next);
        return next;
      },
      run: (op) => sync.run(op),
      leave: async () => {
        await api.leave();
        signedOutBy({ me: sync.getSnapshot().state.me, pair: null });
      },
      deleteAccount: async () => {
        await api.deleteAccount();
        signedOutBy(SIGNED_OUT);
      },
    };
  }, [client, db, store]);

  // Signed in: ask on launch and on every return to the app.
  const signedIn = useSyncExternalStore(
    value.sync.subscribe,
    () => value.sync.getSnapshot().state.me !== null,
  );
  useEffect(() => {
    if (!signedIn) return undefined;
    void value.sync.refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void value.sync.refresh();
    });
    return () => sub.remove();
  }, [signedIn, value]);

  return <TogetherContext value={value}>{children}</TogetherContext>;
}

export function useTogetherActions(): TogetherValue {
  const value = use(TogetherContext);
  if (!value) throw new Error('Budget together needs a TogetherProvider above it');
  return value;
}

/** The shared copy as it should show now; re-renders when it changes. */
export function useTogether(): TogetherSnapshot {
  const { sync } = useTogetherActions();
  return useSyncExternalStore(sync.subscribe, sync.getSnapshot);
}

/** Runs a write and says in the island why it did not go through; resolves to whether it did. */
export function useTogetherRun() {
  const { run } = useTogetherActions();
  const toast = useToast();
  const { t } = useI18n();
  return useCallback(
    async (op: TogetherOp): Promise<boolean> => {
      const result = await run(op);
      if (!result.ok) toast(t(failureKey(result.error)));
      return result.ok;
    },
    [run, toast, t],
  );
}

/** The line for a call that failed: no answer at all, or an answer that said no. */
export function failureKey(error: unknown): 'together.error.offline' | 'together.error.failed' {
  const failure = (error as { failure?: unknown } | null)?.failure;
  return failure === 'network' || failure === 'timeout' || failure === 'unavailable'
    ? 'together.error.offline'
    : 'together.error.failed';
}
