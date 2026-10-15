import { describe, expect, it } from 'vitest';

import { currencyOfCountry } from './currencies';
import { COUNTRY_CURRENCY } from './countries';
import { countryOfTimeZone } from './zone-country';

describe('the country of a time zone', () => {
  it('tells apart countries that share an offset', () => {
    expect(countryOfTimeZone('Asia/Ho_Chi_Minh')).toBe('VN');
    expect(countryOfTimeZone('Asia/Saigon')).toBe('VN');
    expect(countryOfTimeZone('Asia/Bangkok')).toBe('TH');
    expect(countryOfTimeZone('Asia/Phnom_Penh')).toBe('KH');
    expect(countryOfTimeZone('Asia/Jakarta')).toBe('ID');
  });

  it('places every zone of a country with many', () => {
    expect(countryOfTimeZone('America/Los_Angeles')).toBe('US');
    expect(countryOfTimeZone('Pacific/Honolulu')).toBe('US');
    expect(countryOfTimeZone('Europe/Paris')).toBe('FR');
    expect(countryOfTimeZone('Australia/Sydney')).toBe('AU');
  });

  it('places nothing it does not know', () => {
    expect(countryOfTimeZone('Mars/Olympus_Mons')).toBeNull();
    expect(countryOfTimeZone('UTC')).toBeNull();
    expect(countryOfTimeZone(null)).toBeNull();
    expect(countryOfTimeZone('')).toBeNull();
  });

  it('only names countries with a currency, so a trip can follow from it', () => {
    expect(currencyOfCountry(countryOfTimeZone('Asia/Tokyo') ?? '')?.code).toBe('JPY');
    for (const zone of ['Asia/Seoul', 'Europe/London', 'America/Toronto', 'Asia/Dubai']) {
      const country = countryOfTimeZone(zone);
      expect(country !== null && COUNTRY_CURRENCY[country] !== undefined).toBe(true);
    }
  });
});
