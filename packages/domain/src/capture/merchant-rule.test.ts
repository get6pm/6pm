import { describe, expect, it } from 'vitest';

import type { MerchantRuleRow } from '../contracts/local-rows';
import { learnedRule, merchantKeyOf, ruleCategoryFor, ruleIndex } from './merchant-rule';

const rule: MerchantRuleRow = {
  merchantKey: 'circle k',
  merchant: 'Circle K',
  categoryId: 'shopping',
  learnedTimes: 2,
  setByUser: true,
};

describe('merchant rules', () => {
  it('keys a merchant without case, edge spaces or doubled spaces', () => {
    expect(merchantKeyOf('  Circle   K ')).toBe('circle k');
  });

  it('files a known merchant under its category', () => {
    const rules = ruleIndex([rule]);
    expect(ruleCategoryFor(rules, 'CIRCLE K', new Set(['shopping', 'food']))).toBe('shopping');
  });

  it('ignores a rule whose category is gone, and unknown merchants', () => {
    const rules = ruleIndex([rule]);
    expect(ruleCategoryFor(rules, 'Circle K', new Set(['food']))).toBeNull();
    expect(ruleCategoryFor(rules, 'Highlands', new Set(['shopping']))).toBeNull();
  });

  it('counts each confirmation as learned once more', () => {
    expect(learnedRule(null, ' Highlands ', 'drinks')).toEqual({
      merchantKey: 'highlands',
      merchant: 'Highlands',
      categoryId: 'drinks',
      learnedTimes: 1,
      setByUser: true,
    });
    expect(learnedRule(rule, 'Circle K', 'food')).toMatchObject({
      categoryId: 'food',
      learnedTimes: 3,
    });
  });
});
