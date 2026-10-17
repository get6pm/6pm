import { describe, expect, it } from '@jest/globals';

import { BANKS, findBank } from '@6pm/domain';

import {
  bankCountry,
  CASH,
  countrySignals,
  POPULAR,
  popularity,
  quickPicks,
  suggestedBanks,
  banksInVietnam,
  type DeviceRegion,
} from './bank-ranking';
import { namedBankId } from './named-bank';

const vietnam: DeviceRegion = { region: 'VN', currency: 'VND', timeZone: 'Asia/Ho_Chi_Minh' };
const known = (id: string) => findBank(id) !== null;

describe('countrySignals', () => {
  it('counts one vote per signal', () => {
    expect([...countrySignals(vietnam)]).toEqual([['VN', 3]]);
  });

  it('splits a Korean phone in Vietnam between the two', () => {
    const signals = countrySignals({ region: 'kr', currency: 'KRW', timeZone: 'Asia/Saigon' });
    expect(signals.get('KR')).toBe(2);
    expect(signals.get('VN')).toBe(1);
  });

  it('ignores what it cannot place', () => {
    expect(countrySignals({ region: null, currency: 'XXX', timeZone: 'Mars/Base' }).size).toBe(0);
  });
});

describe('suggestedBanks', () => {
  it('suggests the most used banks for a Vietnamese phone', () => {
    expect(suggestedBanks(vietnam, 5, 'VND')).toEqual(POPULAR.slice(0, 5));
  });

  it('leads with home banks for a phone from abroad, then the local ones', () => {
    const korean = { region: 'KR', currency: 'KRW', timeZone: 'Asia/Ho_Chi_Minh' };
    expect(suggestedBanks(korean, 5, 'KRW')).toEqual(['SHBVN', 'WVN', 'IBK-HCM', 'MB', 'VCB']);
  });

  it('reads the clock when the region says nothing', () => {
    const thai = { region: null, currency: null, timeZone: 'Asia/Bangkok' };
    expect(suggestedBanks(thai, 3, 'VND')).toEqual(['KBANK', 'MB', 'VCB']);
  });

  it('puts the stronger country first', () => {
    // Set up in Malaysia, now in Singapore: two votes for Malaysia, one for Singapore.
    const device = { region: 'MY', currency: 'MYR', timeZone: 'Asia/Singapore' };
    expect(suggestedBanks(device, 4, 'VND')).toEqual(['CIMB', 'HLBVN', 'PBVN', 'MB']);
  });

  it('suggests the country’s own banks outside Vietnam, never a Vietnamese branch', () => {
    const london = { region: 'GB', currency: 'GBP', timeZone: 'Europe/London' };
    expect(suggestedBanks(london, 3, 'GBP')).toEqual(['GB.BARCLAYS', 'GB.LLOYDS', 'GB.HSBC']);
    const thai = { region: null, currency: null, timeZone: 'Asia/Bangkok' };
    expect(suggestedBanks(thai, 2, 'THB')).toEqual(['TH.KBANK', 'TH.SCB']);
  });

  it('suggests nothing where 6pm has no list', () => {
    const brazil = { region: 'BR', currency: 'BRL', timeZone: 'America/Sao_Paulo' };
    expect(bankCountry(brazil)).toBeNull();
    expect(suggestedBanks(brazil, 6, 'BRL')).toEqual([]);
  });

  it('goes by the region when the phone points two ways', () => {
    // A German phone on a trip to Japan: one vote each, the region first.
    const trip = { region: 'DE', currency: 'EUR', timeZone: 'Asia/Tokyo' };
    expect(bankCountry(trip)).toBe('DE');
    expect(bankCountry({ region: 'BR', currency: null, timeZone: 'Asia/Tokyo' })).toBe('JP');
  });

  it('suggests Vietnam’s banks when home is đồng or the phone is in Vietnam', () => {
    const us = { region: 'US', currency: 'USD', timeZone: 'America/New_York' };
    expect(banksInVietnam(us, 'VND')).toBe(true);
    expect(banksInVietnam(us, 'USD')).toBe(false);
    expect(banksInVietnam({ region: 'KR', currency: 'KRW', timeZone: 'Asia/Saigon' }, 'KRW')).toBe(
      true,
    );
  });

  it('only suggests banks 6pm knows', () => {
    for (const id of [
      ...POPULAR,
      ...suggestedBanks({ region: 'KR', currency: null, timeZone: null }, 20, 'VND'),
    ]) {
      expect(findBank(id)?.id).toBe(id);
    }
  });
});

describe('popularity', () => {
  it('ranks by the list, with everything else last', () => {
    expect(popularity('MB')).toBe(0);
    expect(popularity('VCB')).toBeLessThan(popularity('OCB'));
    expect(popularity('VRB')).toBe(POPULAR.length);
  });
});

describe('quickPicks', () => {
  it('fills two rows with cash and suggestions when nothing is chosen', () => {
    expect(quickPicks([], vietnam, known, 'VND')).toEqual([CASH, ...POPULAR.slice(0, 5)]);
  });

  it('keeps chosen banks in reach, in the order they were chosen', () => {
    expect(quickPicks(['SCB', CASH, 'MB'], vietnam, known, 'VND')).toEqual([
      CASH,
      'SCB',
      'MB',
      'VCB',
      'TCB',
      'BIDV',
    ]);
  });

  it('grows by whole rows when many are chosen', () => {
    const chosen = BANKS.slice(0, 7).map((b) => b.id);
    const picks = quickPicks(chosen, vietnam, known, 'VND');
    expect(picks).toHaveLength(9);
    expect(picks.slice(0, 8)).toEqual([CASH, ...chosen]);
  });

  it('outside Vietnam, offers cash, what was chosen, then the country’s banks', () => {
    const us = { region: 'US', currency: 'USD', timeZone: 'America/New_York' };
    const union = namedBankId('Navy Federal') ?? '';
    expect(quickPicks([], us, known, 'USD')).toEqual([
      CASH,
      'US.CHASE',
      'US.BOFA',
      'US.WELLSFARGO',
      'US.CAPITALONE',
      'US.CITI',
    ]);
    expect(quickPicks([union, 'MB', 'GONE'], us, known, 'USD').slice(0, 4)).toEqual([
      CASH,
      union,
      'MB',
      'US.CHASE',
    ]);
  });

  it('where 6pm has no list, offers cash and what was chosen, typed names included', () => {
    const brazil = { region: 'BR', currency: 'BRL', timeZone: 'America/Sao_Paulo' };
    const nubank = namedBankId('Nubank') ?? '';
    expect(quickPicks([], brazil, known, 'BRL')).toEqual([CASH]);
    expect(quickPicks([nubank, 'MB', 'GONE'], brazil, known, 'BRL')).toEqual([CASH, nubank, 'MB']);
  });

  it('keeps a typed name in reach in Vietnam too', () => {
    const own = namedBankId('Credit union') ?? '';
    expect(quickPicks([own], vietnam, known, 'VND').slice(0, 2)).toEqual([CASH, own]);
  });

  it('drops codes 6pm no longer knows', () => {
    expect(quickPicks(['GONE', 'MB'], vietnam, known, 'VND')).not.toContain('GONE');
  });
});
