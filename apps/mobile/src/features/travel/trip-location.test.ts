import { describe, expect, it, jest } from '@jest/globals';

import { currencyOfCountry } from '@6pm/domain';

jest.mock('expo-location', () => ({
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
jest.mock('expo-localization', () => ({
  getCalendars: () => [{ timeZone: 'Asia/Bangkok' }],
}));

import * as Location from 'expo-location';

import { placeByClock } from './trip-location';

const now = new Date('2026-10-15T05:00:00.000Z');

describe('the place by the clock, for on-device mode', () => {
  it('names the country from the phone’s time zone, without a position or the geocoder', () => {
    const place = placeByClock(now, 'en');
    expect(place).toMatchObject({ country: 'TH', at: now.toISOString() });
    expect(place?.name).not.toBe('');
    expect(currencyOfCountry(place?.country ?? '')?.code).toBe('THB');
    expect(Location.getLastKnownPositionAsync).not.toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(Location.reverseGeocodeAsync).not.toHaveBeenCalled();
  });

  it('tells Hanoi from Bangkok though they share an offset', () => {
    expect(placeByClock(now, 'vi', 'Asia/Ho_Chi_Minh')?.country).toBe('VN');
    expect(placeByClock(now, 'vi', 'Asia/Bangkok')?.country).toBe('TH');
  });

  it('places nothing for a zone it does not know', () => {
    expect(placeByClock(now, 'en', 'UTC')).toBeNull();
    expect(placeByClock(now, 'en', null)).toBeNull();
  });
});
