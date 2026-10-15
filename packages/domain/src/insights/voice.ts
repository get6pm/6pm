import type { DailyNumber } from '../plan/daily-number';
import { merchantKey, slotsOf, type Fact, type InsightSpend } from './fact';

/** Categories a roast never touches: health, rent and the home, family, and gifts. */
export const NEVER_ROAST: ReadonlySet<string> = new Set(['health', 'home', 'family', 'gifts']);

/** The companion's voices: the three personalities, and plain for serious mode. */
export type LineVoice = 'soft' | 'cheeky' | 'roast' | 'plain';

/**
 * The fact is about a category a roast never touches: by its category, by the categories it
 * names in `about`, or by a spend in `spends` at the merchant it names.
 */
export function touchesNeverRoast(fact: Fact, spends: readonly InsightSpend[] = []): boolean {
  const slots = slotsOf(fact);
  const category = slots['category'];
  if (category?.type === 'category' && NEVER_ROAST.has(category.id)) return true;
  if (fact.about?.some((id) => NEVER_ROAST.has(id)) === true) return true;
  const merchant = slots['merchant'];
  if (merchant?.type !== 'merchant') return false;
  const key = merchantKey(merchant.value);
  return spends.some((s) => merchantKey(s.merchant) === key && NEVER_ROAST.has(s.category));
}

/**
 * A day the user is already down on, when no one wants teasing: the cycle's free money is gone,
 * today went over by half its line or more, or going over cut tomorrow's line by a fifth or more.
 */
export function hardDay(day: DailyNumber): boolean {
  if (day.free < 0) return true;
  if (day.safe < 0 && -day.safe * 2 >= day.line) return true;
  return day.replan && day.tomorrow * 5 <= day.line * 4;
}

/**
 * The voice a line about `fact` is said in. Cheeky and roast speak softly about a category they
 * never touch, and on a hard day; soft and plain are always themselves.
 */
export function lineVoice(
  chosen: LineVoice,
  fact: Fact,
  day: DailyNumber,
  spends: readonly InsightSpend[] = [],
): LineVoice {
  if (chosen === 'soft' || chosen === 'plain') return chosen;
  return hardDay(day) || touchesNeverRoast(fact, spends) ? 'soft' : chosen;
}
