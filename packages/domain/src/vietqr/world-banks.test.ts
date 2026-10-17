import { describe, expect, it } from 'vitest';

import { BANKS, banksOf, findBank, findBankByBin, WORLD_BANKS } from './bank-catalogue';

describe('the world’s banks', () => {
  it('never share a code, with each other or with Vietnam’s', () => {
    const ids = [...BANKS, ...WORLD_BANKS].map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toBe(id.toUpperCase());
  });

  it('are found by their code, and never by a NAPAS BIN', () => {
    expect(findBank('us.chase')).toMatchObject({ shortName: 'Chase', country: 'US', bin: null });
    expect(findBank('PAYPAL')).toMatchObject({ kind: 'wallet', country: null });
    expect(WORLD_BANKS.every((b) => b.bin === null && b.ios === null)).toBe(true);
    expect(findBankByBin('970422')?.country).toBe('VN');
  });

  it('list a country’s own, most used first, then the wallets of everywhere', () => {
    const thai = banksOf('th').map((b) => b.id);
    expect(thai[0]).toBe('TH.KBANK');
    expect(thai.slice(-3)).toEqual(['PAYPAL', 'WISE', 'REVOLUT']);
    expect(thai.filter((id) => id.startsWith('TH.')).length).toBeGreaterThanOrEqual(5);
  });

  it('are Vietnam’s own list for Vietnam, and nothing where 6pm has none', () => {
    expect(banksOf('VN')).toEqual([...BANKS]);
    expect(banksOf('BR')).toEqual([]);
  });

  it('give every listed country at least a few to pick from', () => {
    const countries = new Set(WORLD_BANKS.flatMap((b) => (b.country ? [b.country] : [])));
    for (const country of countries) {
      expect(banksOf(country).length).toBeGreaterThanOrEqual(5);
    }
  });
});
