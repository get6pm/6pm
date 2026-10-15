import { useMemo } from 'react';

import { currencyOf, moneyFormat, moneyLocale, type Currency, type MoneyFormat } from '@6pm/domain';

import { useMoneySelector } from '../data/money-provider';
import { homeCurrencyCode, type PlanSettings } from '../data/plan-settings';
import { useI18n } from '../i18n/i18n';
import { deviceCurrencyCode, phoneNumberStyle } from './device-money';

/** The home currency of a snapshot's plan; the phone's before there is one. */
export function homeCurrencyOf(plan: PlanSettings | null): Currency {
  return currencyOf(homeCurrencyCode(plan, deviceCurrencyCode()));
}

/** How to write money in a currency, the way this phone writes numbers. */
export function moneyFormatFor(currency: Currency, language: 'en' | 'vi'): MoneyFormat {
  return moneyFormat(moneyLocale(currency, language, phoneNumberStyle()));
}

const selectCode = (s: { plan: PlanSettings | null }) =>
  homeCurrencyCode(s.plan, deviceCurrencyCode());

/** The home currency, re-read only when it changes. */
export function useHomeCurrency(): Currency {
  const code = useMoneySelector(selectCode);
  return useMemo(() => currencyOf(code), [code]);
}

/**
 * How every screen writes money: `full`, `short`, `parts` and `spoken` in the home currency, in
 * the app's language and the phone's number style. VND keeps the design's exact forms.
 */
export function useMoneyFormat(): MoneyFormat {
  const currency = useHomeCurrency();
  const { language } = useI18n();
  return useMemo(() => moneyFormatFor(currency, language), [currency, language]);
}
