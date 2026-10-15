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
import { AppState } from 'react-native';

import { fxRatesResponseSchema, type FxRate } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { useApi } from '../api/native-api';
import { useAiMode } from '../privacy/use-ai-mode';
import { useEntitlement } from '../purchases/purchases-provider';
import {
  askForLocation,
  currentPlace,
  locationAccess,
  placeByClock,
  type LocationAccess,
} from './trip-location';
import {
  dongQuoteOf,
  FX_CACHE_KEY,
  nextFxCache,
  parseFxCache,
  parsePlace,
  rateFor,
  shouldRefreshRates,
  TRAVEL_ON_KEY,
  TRAVEL_PLACE_KEY,
  tripOf,
  type FxCache,
  type Place,
  type Trip,
} from './trip';

export interface TravelValue {
  /** The Settings switch. */
  readonly on: boolean;
  /** Max is not active: the switch opens the Max sheet instead. */
  readonly locked: boolean;
  /** Location access, once the switch has been turned on; null before it is known. */
  readonly access: LocationAccess | null;
  /** The trip under way, or null at home, with the switch off, or without Max. */
  readonly trip: Trip | null;
  /** The last good set of rates (đồng quotes), kept for offline use. */
  readonly rates: FxCache | null;
  /**
   * A currency's rate in home units from the kept set, on a trip or not: a VietQR or a đồng
   * receipt on a phone whose home is not đồng is converted with it. Null for home itself.
   */
  readonly homeRateFor: (currency: string) => FxRate | null;
  /** The đồng for one unit of a currency in the kept set ("1" for the đồng), or null. */
  readonly dongQuote: (currency: string) => string | null;
  /** Turns the switch; turning it on asks for location the first time. */
  readonly setOn: (next: boolean) => void;
  /** Fetches the rates now if the kept set is old (Scan calls it on a foreign QR). */
  readonly refreshRates: () => void;
}

const TravelContext = createContext<TravelValue | null>(null);

/**
 * Travel mode for the whole app. The switch, the last place and the last rates are read
 * synchronously at launch, so Home's pill is there in the first frame; the place is checked
 * again whenever the app comes to the foreground with the switch on, and the rates (every six
 * hours at most) whether it is on or not, with or without Max: converting a scanned VietQR or a
 * shared receipt into a home that is not đồng is not a Max feature. A trip is wherever the
 * currency is not home's.
 */
export function TravelProvider({ children }: { readonly children: ReactNode }) {
  const db = useSQLiteContext();
  const api = useApi();
  const { max } = useEntitlement();
  const home = useHomeCurrency();
  const { language } = useI18n();
  const mode = useAiMode();
  const read = (key: string) =>
    db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key])?.value;
  const [on, setOnState] = useState(() => read(TRAVEL_ON_KEY) === '1');
  const [place, setPlace] = useState<Place | null>(() => parsePlace(read(TRAVEL_PLACE_KEY)));
  const [rates, setRates] = useState<FxCache | null>(() => parseFxCache(read(FX_CACHE_KEY)));
  const [access, setAccess] = useState<LocationAccess | null>(null);
  const [now, setNow] = useState(() => new Date());
  const ratesRef = useRef(rates);
  ratesRef.current = rates;
  const fetching = useRef(false);

  const keep = useCallback(
    (key: string, value: string | null) => {
      const write =
        value === null
          ? db.runAsync('DELETE FROM settings WHERE key = ?', [key])
          : db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
      write.catch((error: unknown) => console.error('Keeping Travel mode failed', error));
    },
    [db],
  );

  const refreshRates = useCallback(() => {
    const at = new Date();
    if (fetching.current || !shouldRefreshRates(ratesRef.current, at)) return;
    fetching.current = true;
    api
      .request({ path: '/v1/fx', schema: fxRatesResponseSchema })
      .then((answer) => {
        const next = nextFxCache(ratesRef.current, answer, at);
        if (next === null || next === ratesRef.current) return;
        setRates(next);
        keep(FX_CACHE_KEY, JSON.stringify(next));
      })
      // Offline or the server is down: the kept set stands.
      .catch(() => undefined)
      .finally(() => {
        fetching.current = false;
      });
  }, [api, keep]);

  const locate = useCallback(async () => {
    // On-device mode: the clock's time zone names the country; no position, no geocoder.
    if (mode === 'device') {
      setAccess(null);
      const found = placeByClock(new Date(), language);
      if (found === null) return;
      setPlace(found);
      keep(TRAVEL_PLACE_KEY, JSON.stringify(found));
      return;
    }
    const current = await locationAccess();
    setAccess(current);
    if (current !== 'granted') return;
    const found = await currentPlace(new Date());
    if (found === null) return;
    setPlace(found);
    keep(TRAVEL_PLACE_KEY, JSON.stringify(found));
  }, [keep, mode, language]);

  // Today's rates, now and on every return, whether or not the switch is on: a receipt shared
  // from abroad is priced with them (the share extension reads them from its context).
  useEffect(() => {
    refreshRates();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshRates();
    });
    return () => sub.remove();
  }, [refreshRates]);

  // With the switch on: where the phone is, now and on every return.
  useEffect(() => {
    if (!on || !max) return undefined;
    const check = () => {
      setNow(new Date());
      locate().catch(() => undefined);
    };
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [on, max, locate]);

  const setOn = useCallback(
    (next: boolean) => {
      setOnState(next);
      keep(TRAVEL_ON_KEY, next ? '1' : null);
      if (!next) return;
      // On-device mode takes no position, so it never asks for location.
      if (mode === 'device') {
        locate().catch(() => undefined);
        return;
      }
      // The prompt comes only from this tap, as the prototype has it.
      locationAccess()
        .then((current) => (current === 'ask' ? askForLocation() : current))
        .then((answer) => {
          setAccess(answer);
          if (answer === 'granted') return locate();
          return undefined;
        })
        .catch(() => undefined);
    },
    [keep, locate, mode],
  );

  const trip = useMemo(
    () => tripOf({ on, max, place, cache: rates, now, home }),
    [on, max, place, rates, now, home],
  );
  const homeRateFor = useCallback(
    (currency: string) => rateFor(rates, currency, home),
    [rates, home],
  );
  const dongQuote = useCallback((currency: string) => dongQuoteOf(rates, currency), [rates]);
  const value = useMemo<TravelValue>(
    () => ({
      on,
      locked: !max,
      access,
      trip,
      rates,
      homeRateFor,
      dongQuote,
      setOn,
      refreshRates,
    }),
    [on, max, access, trip, rates, homeRateFor, dongQuote, setOn, refreshRates],
  );
  return <TravelContext value={value}>{children}</TravelContext>;
}

export function useTravel(): TravelValue {
  const value = use(TravelContext);
  if (!value) throw new Error('useTravel needs a TravelProvider above it');
  return value;
}
