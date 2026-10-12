import * as Location from 'expo-location';

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
