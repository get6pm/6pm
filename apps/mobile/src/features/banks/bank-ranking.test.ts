import { describe, expect, it } from '@jest/globals';

import { BANKS, findBank } from '@6pm/domain';

import {
  CASH,
  countrySignals,
  POPULAR,
  popularity,
  quickPicks,
  suggestedBanks,
  type DeviceRegion,
} from './bank-ranking';

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
    expect(suggestedBanks(vietnam, 5)).toEqual(POPULAR.slice(0, 5));
  });

  it('leads with home banks for a phone from abroad, then the local ones', () => {
    const korean = { region: 'KR', currency: 'KRW', timeZone: 'Asia/Ho_Chi_Minh' };
    expect(suggestedBanks(korean, 5)).toEqual(['SHBVN', 'WVN', 'IBK-HCM', 'MB', 'VCB']);
  });

  it('reads the clock when the region says nothing', () => {
    const thai = { region: null, currency: null, timeZone: 'Asia/Bangkok' };
    expect(suggestedBanks(thai, 3)).toEqual(['KBANK', 'MB', 'VCB']);
  });

  it('puts the stronger country first', () => {
    // Set up in Malaysia, now in Singapore: two votes for Malaysia, one for Singapore.
    const device = { region: 'MY', currency: 'MYR', timeZone: 'Asia/Singapore' };
    expect(suggestedBanks(device, 4)).toEqual(['CIMB', 'HLBVN', 'PBVN', 'MB']);
  });

  it('only suggests banks 6pm knows', () => {
    for (const id of [
      ...POPULAR,
      ...suggestedBanks({ region: 'KR', currency: null, timeZone: null }, 20),
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
    expect(quickPicks([], vietnam, known)).toEqual([CASH, ...POPULAR.slice(0, 5)]);
  });

  it('keeps chosen banks in reach, in the order they were chosen', () => {
    expect(quickPicks(['SCB', CASH, 'MB'], vietnam, known)).toEqual([
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
    const picks = quickPicks(chosen, vietnam, known);
    expect(picks).toHaveLength(9);
    expect(picks.slice(0, 8)).toEqual([CASH, ...chosen]);
  });

  it('drops codes 6pm no longer knows', () => {
    expect(quickPicks(['GONE', 'MB'], vietnam, known)).not.toContain('GONE');
  });
});
