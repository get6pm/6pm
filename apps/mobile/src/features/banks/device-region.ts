import { getCalendars, getLocales } from 'expo-localization';

import type { DeviceRegion } from './bank-ranking';

/**
 * Where the phone is set up for and where its clock says it is, from the system settings: no
 * location permission is asked for.
 */
export function readDeviceRegion(): DeviceRegion {
  const locale = getLocales()[0];
  const calendar = getCalendars()[0];
  return {
    region: locale?.regionCode ?? null,
    currency: locale?.currencyCode ?? null,
    timeZone: calendar?.timeZone ?? null,
  };
}
