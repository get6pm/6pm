import { useSQLiteContext } from 'expo-sqlite';
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
import { AppState, Platform } from 'react-native';

import type { LookId } from '@6pm/theme';

import { CUSTOMER_KEY, parseCustomer, serializeCustomer } from './customer-memory';
import { canUseLook } from './entitlement';
import { revenueCatPurchases } from './revenuecat-port';
import {
  unavailablePurchases,
  type CustomerState,
  type Offerings,
  type PurchaseOutcome,
  type PurchasesPort,
} from './purchases-port';

export type OfferingsStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export type RestoreOutcome =
  /** The store answered and this Apple ID holds something. */
  | { readonly kind: 'found'; readonly customer: CustomerState }
  /** The store answered and this Apple ID holds nothing. */
  | { readonly kind: 'none' }
  | { readonly kind: 'failed' };

export interface PurchasesValue {
  readonly port: PurchasesPort;
  /** The store's last word, or what the phone kept from the last launch until the store answers. */
  readonly customer: CustomerState;
  readonly offerings: Offerings | null;
  readonly offeringsStatus: OfferingsStatus;
  /** Fetches the store's prices when they are not here yet. */
  readonly loadOfferings: () => void;
  /** A purchase or a restore is with the store. */
  readonly busy: boolean;
  readonly buy: (productId: string) => Promise<PurchaseOutcome>;
  readonly restore: () => Promise<RestoreOutcome>;
  readonly manageSubscription: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesValue | null>(null);

let defaultPort: PurchasesPort | null = null;

/** RevenueCat with the platform's public SDK key; without one, the port that says no. */
function appPort(): PurchasesPort {
  defaultPort ??=
    Platform.OS === 'ios'
      ? revenueCatPurchases(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY)
      : Platform.OS === 'android'
        ? revenueCatPurchases(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY)
        : unavailablePurchases;
  return defaultPort;
}

/**
 * What this phone has bought, kept in step with the store. The last known customer is read
 * synchronously at launch, so the first frame already wears the right look; the store's answer
 * replaces it a moment later and is kept for the next launch.
 */
export function PurchasesProvider({
  children,
  port = appPort(),
}: {
  readonly children: ReactNode;
  readonly port?: PurchasesPort;
}) {
  const db = useSQLiteContext();
  const [customer, setCustomerState] = useState<CustomerState>(() =>
    parseCustomer(
      db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [CUSTOMER_KEY])
        ?.value,
    ),
  );
  // The kept text of the customer on screen: a store answer that says the same changes nothing.
  const keptRef = useRef<string | null>(null);
  keptRef.current ??= serializeCustomer(customer);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [offeringsStatus, setStatus] = useState<OfferingsStatus>('idle');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const statusRef = useRef<OfferingsStatus>('idle');

  const setCustomer = useCallback(
    (next: CustomerState) => {
      const text = serializeCustomer(next);
      if (text === keptRef.current) return;
      keptRef.current = text;
      setCustomerState(next);
      db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        CUSTOMER_KEY,
        text,
      ]).catch((error: unknown) => console.error('Keeping the purchases failed', error));
    },
    [db],
  );

  const loadOfferings = useCallback(() => {
    if (!port.available || statusRef.current === 'loading' || statusRef.current === 'ready') return;
    statusRef.current = 'loading';
    setStatus('loading');
    port.offerings().then(
      (next) => {
        statusRef.current = 'ready';
        setOfferings(next);
        setStatus('ready');
      },
      () => {
        statusRef.current = 'unavailable';
        setStatus('unavailable');
      },
    );
  }, [port]);

  useEffect(() => {
    if (!port.available) {
      statusRef.current = 'unavailable';
      setStatus('unavailable');
      return undefined;
    }
    const refresh = () => {
      // Without the store's word, the kept customer is read again: a Max that ran out meanwhile
      // ends here too.
      port.customer().then(setCustomer, () => setCustomer(parseCustomer(keptRef.current)));
    };
    // Prices are the shop's and the Max sheet's business: they ask when they open.
    refresh();
    const stop = port.onCustomerChange(setCustomer);
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      stop();
      app.remove();
    };
  }, [port, setCustomer]);

  const buy = useCallback(
    async (productId: string): Promise<PurchaseOutcome> => {
      if (busyRef.current) return { kind: 'cancelled' };
      busyRef.current = true;
      setBusy(true);
      try {
        const outcome = await port.purchase(productId);
        if (outcome.kind === 'purchased') setCustomer(outcome.customer);
        return outcome;
      } catch {
        return { kind: 'failed' };
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [port, setCustomer],
  );

  const restore = useCallback(async (): Promise<RestoreOutcome> => {
    if (busyRef.current) return { kind: 'failed' };
    busyRef.current = true;
    setBusy(true);
    try {
      const restored = await port.restore();
      setCustomer(restored);
      const holdsSomething = restored.max.active || restored.ownedLooks.length > 0;
      return holdsSomething ? { kind: 'found', customer: restored } : { kind: 'none' };
    } catch {
      return { kind: 'failed' };
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [port, setCustomer]);

  const value = useMemo<PurchasesValue>(
    () => ({
      port,
      customer,
      offerings,
      offeringsStatus,
      loadOfferings,
      busy,
      buy,
      restore,
      manageSubscription: () => port.manageSubscriptions(),
    }),
    [port, customer, offerings, offeringsStatus, loadOfferings, busy, buy, restore],
  );
  return <PurchasesContext value={value}>{children}</PurchasesContext>;
}

export function usePurchases(): PurchasesValue {
  const value = use(PurchasesContext);
  if (!value) throw new Error('Purchase hooks need a PurchasesProvider above them');
  return value;
}

/** What this customer can wear: the one place a screen asks. */
export function useEntitlement() {
  const { customer } = usePurchases();
  return useMemo(
    () => ({
      customer,
      max: customer.max.active,
      canUse: (look: LookId) => canUseLook(look, customer),
    }),
    [customer],
  );
}
