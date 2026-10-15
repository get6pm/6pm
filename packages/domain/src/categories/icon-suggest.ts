import { foldWords } from '../capture/spoken-spend';
import { EVERYDAY_ICON_WORDS } from './icon-words-everyday';
import { LIFE_ICON_WORDS } from './icon-words-life';
import { PLACES_ICON_WORDS } from './icon-words-places';

const ICON_WORDS = { ...EVERYDAY_ICON_WORDS, ...PLACES_ICON_WORDS, ...LIFE_ICON_WORDS };

/** Every icon a category can wear, as the app's icon packs list them. */
export type CategoryIcon = keyof typeof ICON_WORDS;

export const CATEGORY_ICONS = Object.keys(ICON_WORDS) as readonly CategoryIcon[];

export function isCategoryIcon(name: string): name is CategoryIcon {
  return Object.hasOwn(ICON_WORDS, name);
}

/** What the icon stands for, in English: the option text when a model chooses among icons. */
export function categoryIconMeaning(icon: CategoryIcon): string {
  return ICON_WORDS[icon][0];
}

const foldedWords = new Map<CategoryIcon, readonly string[]>(
  CATEGORY_ICONS.map((icon) => [
    icon,
    ICON_WORDS[icon][1]
      .split(',')
      .map((word) => foldWords(word).trim())
      .filter((word) => word !== ''),
  ]),
);

/**
 * The icon a category's name points to, from the icons the person may use, read on the phone:
 * English or Vietnamese, with or without accents ("Cà phê", "ca phe" and "Coffee" all find the
 * cup). Words match whole, a trailing "s" allowed ("Coffees"). The longest matching word wins, so
 * "Nhà hàng" is a restaurant and not a home; between equal words, the icon listed first. Null
 * when no word matches.
 */
export function suggestCategoryIcon(
  name: string,
  icons: readonly string[] = CATEGORY_ICONS,
): CategoryIcon | null {
  const folded = foldWords(name);
  if (folded.trim() === '') return null;
  let best: { icon: CategoryIcon; length: number } | null = null;
  for (const icon of icons) {
    if (!isCategoryIcon(icon)) continue;
    for (const word of foldedWords.get(icon) ?? []) {
      if (best && word.length <= best.length) continue;
      if (folded.includes(` ${word} `) || folded.includes(` ${word}s `)) {
        best = { icon, length: word.length };
      }
    }
  }
  return best?.icon ?? null;
}
