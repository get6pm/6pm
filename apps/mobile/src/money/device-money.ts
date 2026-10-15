import { getLocales } from 'expo-localization';

import type { PhoneNumberStyle } from '@6pm/domain';

import { readDeviceRegion } from '../features/banks/device-region';

/** What a phone with no region set is counted in. */
const NO_REGION_CURRENCY = 'USD';

/** The phone's currency (ISO 4217), from its region: "VND" in Vietnam, "USD" in the US. */
export function deviceCurrencyCode(): string {
  const code = readDeviceRegion().currency;
  return code && /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : NO_REGION_CURRENCY;
}

/** How the phone writes numbers: its first locale and its separators. */
export function phoneNumberStyle(): PhoneNumberStyle {
  const locale = getLocales()[0];
  return {
    languageTag: locale?.languageTag ?? null,
    decimal: locale?.decimalSeparator ?? null,
    group: locale?.digitGroupingSeparator ?? null,
  };
}
