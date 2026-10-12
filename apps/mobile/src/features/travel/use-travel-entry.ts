import {
  emptyKeypad,
  foreignKeypad,
  foreignToVnd,
  formatTypedForeign,
  formatVnd,
  keypadVnd,
  rateNumber,
  type KeypadState,
  type SpendRow,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import type { KeypadCurrencyKey } from '../../ui/keypad';
import type { Trip } from './trip';
import { useTravel } from './travel-provider';

/** A trip with a rate: what entry abroad needs. */
type PricedTrip = Trip & { readonly rate: NonNullable<Trip['rate']> };

const priced = (trip: Trip | null): trip is PricedTrip => trip !== null && trip.rate !== null;

/** Quick add opens in the local currency abroad (once there is a rate), else in đồng. */
export function initialKeypad(trip: Trip | null): KeypadState {
  if (!priced(trip)) return emptyKeypad;
  return foreignKeypad({ code: trip.currency.code, decimals: trip.currency.decimals });
}

export interface TravelEntry {
  /** In đồng, to the nearest đồng. */
  readonly amount: number;
  /** "฿12,5" while typing in the local currency; undefined in đồng. */
  readonly amountText: string | undefined;
  /** "≈ 9.627₫" under a foreign amount; null in đồng. */
  readonly underneath: string | null;
  /** The keypad's currency key abroad; undefined at home. */
  readonly currencyKey: KeypadCurrencyKey | undefined;
  /** What the spend row records about the foreign amount; null in đồng. */
  readonly foreignAmount: SpendRow['foreignAmount'];
}

/**
 * Entry abroad: amounts typed in the local currency show as that currency with đồng underneath,
 * and are kept as đồng with the foreign amount and its rate beside them.
 */
export function useTravelEntry(keys: KeypadState): TravelEntry {
  const { trip } = useTravel();
  const { t, dayMonth } = useI18n();
  if (!priced(trip)) {
    return {
      amount: keypadVnd(keys, 0),
      amountText: undefined,
      underneath: null,
      currencyKey: undefined,
      foreignAmount: null,
    };
  }
  const { currency, rate } = trip;
  const inForeign = keys.currency === currency.code;
  const currencyKey: KeypadCurrencyKey = {
    label: inForeign ? '₫' : currency.symbol,
    accessibilityLabel: t('travel.quick.currency'),
    decimal: inForeign && currency.decimals > 0,
  };
  if (!inForeign) {
    return {
      amount: keypadVnd(keys, 0),
      amountText: undefined,
      underneath: null,
      currencyKey,
      foreignAmount: null,
    };
  }
  const typed = keys.digits.replace(/\.$/, '') || '0';
  const amount = foreignToVnd(typed, rate.rate) ?? 0;
  const vnd = formatVnd(amount);
  return {
    amount,
    amountText: formatTypedForeign(keys.digits, currency),
    underneath: trip.stale
      ? t('travel.quick.underneathStale', {
          amount: vnd,
          date: dayMonth(new Date(`${rate.asOf}T00:00:00`)),
        })
      : t('travel.quick.underneath', { amount: vnd }),
    currencyKey,
    foreignAmount:
      amount > 0
        ? { currency: currency.code, amount: Number(typed), rate: rateNumber(rate.rate) }
        : null,
  };
}
