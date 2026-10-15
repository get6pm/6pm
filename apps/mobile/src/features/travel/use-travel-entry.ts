import {
  foreignKeypad,
  foreignToHome,
  formatTypedForeign,
  homeKeypad,
  homeRate,
  keypadHomeMinor,
  rateNumber,
  type Currency,
  type KeypadState,
  type MoneyParts,
  type SpendRow,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { homeDecimalMark, typedParts } from '../quick-add/typed-amount';
import type { KeypadCurrencyKey } from '../../ui/keypad';
import type { Trip } from './trip';
import { useTravel } from './travel-provider';

/** A trip with a rate in the home currency: what entry abroad needs. */
interface PricedTrip {
  readonly trip: Trip & { readonly rate: NonNullable<Trip['rate']> };
  /** Home units for one unit of the local currency, as an exact decimal. */
  readonly rate: string;
}

/** The đồng for one unit of a currency, from the kept set of the server's quotes. */
type DongQuote = (code: string) => string | null;

/**
 * The trip, when entry can be priced: the server's đồng quotes for the local currency and for
 * home, divided. A trip in the home currency is no trip.
 */
function pricedTrip(trip: Trip | null, home: Currency, dongQuote: DongQuote): PricedTrip | null {
  if (trip === null || trip.rate === null || trip.currency.code === home.code) return null;
  const rate = homeRate(trip.currency.code, home, dongQuote);
  return rate === null ? null : { trip: { ...trip, rate: trip.rate }, rate };
}

/** Quick add opens in the local currency abroad (once there is a rate), else in the home currency. */
export function initialKeypad(
  trip: Trip | null,
  home: Currency,
  dongQuote: DongQuote,
): KeypadState {
  const priced = pricedTrip(trip, home, dongQuote);
  if (priced === null) return homeKeypad(home);
  const { currency } = priced.trip;
  return foreignKeypad({ code: currency.code, decimals: currency.decimals }, home);
}

export interface TravelEntry {
  /** In minor units of the home currency, to the nearest one. */
  readonly amount: number;
  /** What is typed, as it will be written: "฿12,5" abroad, "$12.5" or "45.000₫" at home. */
  readonly typed: MoneyParts;
  /** "≈ $9.63" under a foreign amount; null in the home currency. */
  readonly underneath: string | null;
  /** The keypad's currency key abroad; undefined at home. */
  readonly currencyKey: KeypadCurrencyKey | undefined;
  /** The decimal key's mark while typing in a home currency with decimals. */
  readonly decimal: string | undefined;
  /** What the spend row records about the foreign amount; null in the home currency. */
  readonly foreignAmount: SpendRow['foreignAmount'];
}

/**
 * Entry abroad: amounts typed in the local currency show as that currency with home underneath,
 * and are kept in the home currency with the foreign amount and its rate (home units for one
 * unit) beside them.
 */
export function useTravelEntry(keys: KeypadState): TravelEntry {
  const { trip, dongQuote } = useTravel();
  const money = useMoneyFormat();
  const home = money.currency;
  const { t, dayMonth } = useI18n();
  const priced = pricedTrip(trip, home, dongQuote);
  const atHome: Omit<TravelEntry, 'currencyKey'> = {
    amount: keypadHomeMinor({ ...keys, home: home.code }),
    typed: typedParts(keys.digits, money),
    underneath: null,
    decimal: homeDecimalMark(money),
    foreignAmount: null,
  };
  if (priced === null) return { ...atHome, currencyKey: undefined };
  const { trip: abroad, rate } = priced;
  const { currency } = abroad;
  const inForeign = keys.currency === currency.code;
  const currencyKey: KeypadCurrencyKey = {
    label: inForeign ? home.symbol : currency.symbol,
    accessibilityLabel: t('travel.quick.currency'),
    decimal: inForeign && currency.decimals > 0,
  };
  if (!inForeign) return { ...atHome, currencyKey };
  const typed = keys.digits.replace(/\.$/, '') || '0';
  const amount = foreignToHome(typed, rate, home) ?? 0;
  const inHome = money.full(amount);
  return {
    amount,
    typed: {
      sign: '',
      prefix: currency.symbol,
      number: formatTypedForeign(keys.digits, currency).slice(currency.symbol.length),
      suffix: '',
    },
    underneath: abroad.stale
      ? t('travel.quick.underneathStale', {
          amount: inHome,
          date: dayMonth(new Date(`${abroad.rate.asOf}T00:00:00`)),
        })
      : t('travel.quick.underneath', { amount: inHome }),
    currencyKey,
    decimal: undefined,
    foreignAmount:
      amount > 0
        ? { currency: currency.code, amount: Number(typed), rate: rateNumber(rate) }
        : null,
  };
}
