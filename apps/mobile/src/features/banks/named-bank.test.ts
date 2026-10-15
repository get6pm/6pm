import { describe, expect, it } from '@jest/globals';

import { findBank } from '@6pm/domain';

import { bankNameOf, isNamedBank, namedBankId, tidyBankName } from './named-bank';

describe('named banks', () => {
  it('saves a typed name apart from every catalogue code', () => {
    const id = namedBankId('  MB  ');
    expect(id).toBe('name:MB');
    expect(findBank(id ?? '')).toBeNull();
    expect(bankNameOf(id ?? '')).toBe('MB');
    expect(isNamedBank('MB')).toBe(false);
    expect(isNamedBank('CASH')).toBe(false);
  });

  it('tidies what was typed and refuses nothing', () => {
    expect(tidyBankName('Chase \n  Bank ')).toBe('Chase Bank');
    expect(namedBankId('   ')).toBeNull();
    expect(bankNameOf('name:')).toBeNull();
    expect(tidyBankName('x'.repeat(80))).toHaveLength(40);
  });
});
