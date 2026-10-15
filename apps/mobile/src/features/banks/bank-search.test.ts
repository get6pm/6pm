import { describe, expect, it } from '@jest/globals';

import { BANKS } from '@6pm/domain';

import { normalise, searchBanks } from './bank-search';

const ids = (query: string) => searchBanks(BANKS, query).map((b) => b.id);

describe('normalise', () => {
  it('drops accents and reads đ as d', () => {
    expect(normalise('Ngân hàng TMCP Quân đội')).toBe('ngan hang tmcp quan doi');
    expect(normalise('ĐÔNG Á')).toBe('dong a');
  });

  it('folds punctuation and spacing into single spaces', () => {
    expect(normalise('  Sài Gòn - Hà Nội ')).toBe('sai gon ha noi');
    expect(normalise('IBK-HCM')).toBe('ibk hcm');
  });

  it('treats composed and decomposed letters alike', () => {
    expect(normalise('Việt'.normalize('NFD'))).toBe(normalise('Việt'.normalize('NFC')));
  });
});

describe('searchBanks', () => {
  it('matches nothing on an empty or blank query', () => {
    expect(ids('')).toEqual([]);
    expect(ids('  - ')).toEqual([]);
  });

  it('puts an exact code or short name first', () => {
    expect(ids('mb')[0]).toBe('MB');
    expect(ids('VCB')[0]).toBe('VCB');
    expect(ids('acb')[0]).toBe('ACB');
  });

  it('ignores spaces inside a name', () => {
    expect(ids('mb bank')[0]).toBe('MB');
    expect(ids('vietin bank')[0]).toBe('ICB');
    expect(ids('zalo pay')[0]).toBe('ZALOPAY');
  });

  it('finds a bank by its registered name, without accents', () => {
    expect(ids('quan doi')).toContain('MB');
    expect(ids('ngoai thuong')[0]).toBe('VCB');
    expect(ids('Kỹ Thương')[0]).toBe('TCB');
  });

  it('finds a bank by the name of its app or an old name', () => {
    expect(ids('digimi')).toEqual(['VCCB']);
    expect(ids('lienviet')[0]).toBe('LPB');
    expect(ids('viettelpay')[0]).toBe('VTLMONEY');
  });

  it('ranks name starts before matches inside a word, and the more used bank first', () => {
    const viet = ids('viet');
    expect(viet.indexOf('ICB')).toBeLessThan(viet.indexOf('VIETBANK'));
    expect(viet.indexOf('VCB')).toBeLessThan(viet.indexOf('VAB'));
  });

  it('needs every word to match', () => {
    expect(ids('sacombank zzz')).toEqual([]);
  });
});
