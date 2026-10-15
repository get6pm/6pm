import { getCalendars } from 'expo-localization';
import * as Location from 'expo-location';

import { countryOfTimeZone } from '@6pm/domain';

import type { Place } from './trip';

/**
 * Which country the phone is in, while the app is open and only after the user turned Travel
 * mode on (the prompt is asked then, never before). Bangkok shares Vietnam's UTC+7, so the time
 * zone cannot tell; a coarse fix and the system's reverse geocoder can.
 */
export type LocationAccess = 'granted' | 'denied' | 'ask';

function accessOf(response: Location.LocationPermissionResponse): LocationAccess {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'ask' : 'denied';
}

export async function locationAccess(): Promise<LocationAccess> {
  return accessOf(await Location.getForegroundPermissionsAsync());
}

export async function askForLocation(): Promise<LocationAccess> {
  return accessOf(await Location.requestForegroundPermissionsAsync());
}

/** A fix this recent is good enough to name a country. */
const RECENT_MS = 60 * 60 * 1000;

/** Where the phone is now, or null when it cannot tell (no fix, no geocoder answer). */
export async function currentPlace(now: Date): Promise<Place | null> {
  const position =
    (await Location.getLastKnownPositionAsync({ maxAge: RECENT_MS })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }));
  const [address] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  const country = address?.isoCountryCode?.toUpperCase();
  if (!country) return null;
  // In a city made of districts (Bangkok) the geocoder's "city" is the district and the region is
  // the city: "Phra Nakhon District" in "Bangkok". The pill names the city.
  const city = address?.city && address.city !== address.subregion ? address.city : null;
  const name = city ?? address?.region ?? address?.city ?? address?.country ?? country;
  return { country, name, at: now.toISOString() };
}

/** A country's name in a language, where the runtime knows it. */
function countryName(country: string, language: string): string | null {
  try {
    if (typeof Intl.DisplayNames !== 'function') return null;
    return new Intl.DisplayNames([language], { type: 'region' }).of(country) ?? null;
  } catch {
    return null;
  }
}

/**
 * Where the phone is by its clock alone, for on-device mode, where no position is taken and
 * nothing is sent to Apple's geocoder: the time zone the phone set for where it is names the
 * country (`Asia/Bangkok`), and the place is called by the country's name. Null for a zone 6pm
 * cannot place.
 */
export function placeByClock(
  now: Date,
  language: string,
  zone: string | null = getCalendars()[0]?.timeZone ?? null,
): Place | null {
  const country = countryOfTimeZone(zone);
  if (country === null) return null;
  return { country, name: countryName(country, language) ?? country, at: now.toISOString() };
}
