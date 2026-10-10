import type { Entry } from './catalogue-types';

type LooseCatalogue = Readonly<Record<string, Entry>>;

/** Words that are deliberately the same in English and Vietnamese. Keep this list short. */
export const sameInBothLanguages: readonly string[] = [
  '6pm',
  'Max',
  'MAX',
  'Inbox',
  'VietQR',
  'MB Bank',
  'Email',
  'Apple Pay',
  'Nước mía',
  'Xôi',
  'Vietcombank',
  'MoMo',
];

function texts(entry: Entry): string[] {
  return typeof entry === 'string' ? [entry] : Object.values(entry);
}

/** The sorted `{name}` placeholders of an entry; a plural always takes `count`. */
function paramNames(entry: Entry): string[] {
  const names = new Set<string>(typeof entry === 'string' ? [] : ['count']);
  for (const text of texts(entry)) {
    for (const match of text.matchAll(/\{(\w+)\}/g)) names.add(match[1] ?? '');
  }
  return [...names].sort();
}

/**
 * Everything wrong with a translation measured against the source catalogue, one line per
 * problem, each naming its key. An empty list means the translation is complete.
 */
export function findCatalogueProblems(
  source: LooseCatalogue,
  translation: LooseCatalogue,
  sameInBoth: readonly string[] = sameInBothLanguages,
): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(translation)) {
    if (!(key in source)) problems.push(`${key}: only in the translation`);
  }
  for (const [key, sourceEntry] of Object.entries(source)) {
    const entry = translation[key];
    if (entry === undefined) {
      problems.push(`${key}: missing from the translation`);
      continue;
    }
    if ((typeof entry === 'string') !== (typeof sourceEntry === 'string')) {
      problems.push(`${key}: plural in one language only`);
      continue;
    }
    const expected = paramNames(sourceEntry).join(', ');
    const actual = paramNames(entry).join(', ');
    if (expected !== actual) {
      problems.push(`${key}: parameters differ ({${expected}} against {${actual}})`);
    }
    const sourceTexts = texts(sourceEntry);
    for (const text of texts(entry)) {
      if (text.trim() === '') {
        problems.push(`${key}: empty translation`);
      } else if (sourceTexts.includes(text) && !sameInBoth.includes(text)) {
        problems.push(`${key}: identical to the source ("${text}")`);
      }
    }
  }
  return problems;
}
