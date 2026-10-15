import { describe, expect, it } from 'vitest';

import { countryAt, currencyAt } from './photo-place';

describe('where a photo was taken', () => {
  it.each([
    ['Uluwatu', -8.83, 115.09, 'IDR'],
    ['Canggu', -8.65, 115.14, 'IDR'],
    ['Saigon', 10.78, 106.7, 'VND'],
    ['Phú Quốc, across the water from Kampot', 10.4, 103.95, 'VND'],
    ['Hà Tiên, by the Cambodian border', 10.39, 104.48, 'VND'],
    ['Lào Cai, by the Chinese border', 22.5, 103.96, 'VND'],
    ['Kampot', 10.6, 104.17, 'KHR'],
    ['Singapore', 1.3, 103.84, 'SGD'],
    ['Bangkok', 13.74, 100.52, 'THB'],
    ['Tokyo', 35.68, 139.76, 'JPY'],
    ['Paris', 48.85, 2.35, 'EUR'],
    ['the middle of Australia', -25.3, 131.0, 'AUD'],
  ] as const)('reads %s', (_, latitude, longitude, currency) => {
    expect(currencyAt(latitude, longitude)).toBe(currency);
  });

  it('knows a country outside the region Travel was designed around, and its currency', () => {
    expect(countryAt(47.38, 8.54)).toBe('CH');
    expect(currencyAt(47.38, 8.54)).toBe('CHF');
  });

  it('says nothing out at sea or for a reading that is not a place', () => {
    expect(currencyAt(0, -150)).toBeNull();
    expect(currencyAt(Number.NaN, 106)).toBeNull();
    expect(currencyAt(95, 106)).toBeNull();
  });
});
