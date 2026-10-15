import { categoryIconMeaning, type CategoryIcon } from '@6pm/domain';

import { decide, type DecideContext } from './decide';
import type { ChoiceQuestion } from './jev';

/**
 * Below this, the answer is a guess spread over many icons: the phone keeps the icon it has.
 * The fallback's confidence is its top probability, so this also holds when DeepSeek answered.
 */
export const ICON_PICK_MIN_CONFIDENCE = 0.3;

const instructions =
  'The state is the name a person gave a spending category in their money app, in English or ' +
  'Vietnamese, with or without accents. Which icon shows what the money in that category is ' +
  'spent on? Go by what the name means, not by letters it shares with an icon.';

/** The closed question: the icons the phone may use, each with what it stands for. */
export function pickIconQuestion(icons: readonly CategoryIcon[]): ChoiceQuestion<CategoryIcon> {
  return {
    instructions,
    criteria: Object.fromEntries(icons.map((icon) => [icon, categoryIconMeaning(icon)])) as Record<
      CategoryIcon,
      string
    >,
  };
}

/**
 * Chooses one icon for a category name from the icons given: Jev first, the fast generation tier
 * when Jev does not answer, one cost ledger row either way. Null when the answer is not sure.
 */
export async function pickCategoryIcon(
  context: DecideContext,
  name: string,
  icons: readonly CategoryIcon[],
): Promise<CategoryIcon | null> {
  const decision = await decide(context, { ...pickIconQuestion(icons), text: name });
  const { choice, confidence } = decision.answer;
  return confidence >= ICON_PICK_MIN_CONFIDENCE && icons.includes(choice) ? choice : null;
}
