import type { MerchantRuleRow } from '../contracts/local-rows';

/** The key a merchant's rule is stored under: trimmed, lower case, single spaces. */
export function merchantKeyOf(merchant: string): string {
  return merchant.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** The rule table as a lookup by merchant key. */
export function ruleIndex(rules: readonly MerchantRuleRow[]): ReadonlyMap<string, MerchantRuleRow> {
  return new Map(rules.map((rule) => [rule.merchantKey, rule]));
}

/**
 * The category a rule files a merchant under, when that category still exists. A rule pointing at
 * a category that was archived or deleted is ignored rather than filing money nowhere.
 */
export function ruleCategoryFor(
  rules: ReadonlyMap<string, MerchantRuleRow>,
  merchant: string,
  categoryIds: ReadonlySet<string>,
): string | null {
  const rule = rules.get(merchantKeyOf(merchant));
  return rule && categoryIds.has(rule.categoryId) ? rule.categoryId : null;
}

/**
 * Saying "always" for a merchant: a new rule, or the existing one pointed at the new category.
 * Every time the user confirms it, 6pm has learned it once more.
 */
export function learnedRule(
  existing: MerchantRuleRow | null,
  merchant: string,
  categoryId: string,
): MerchantRuleRow {
  return {
    merchantKey: merchantKeyOf(merchant),
    merchant: merchant.trim(),
    categoryId,
    learnedTimes: (existing?.learnedTimes ?? 0) + 1,
    setByUser: true,
  };
}
