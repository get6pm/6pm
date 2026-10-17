import type { Entry } from './catalogue-types';

type LooseCatalogue = Readonly<Record<string, Entry>>;

/** Words that are deliberately the same in English and Vietnamese. Keep this list short. */
export const sameInBothLanguages: readonly string[] = [
  '6pm',
  'Max',
  'MAX',
  'Inbox',
  'VietQR',
  'VietQR · NAPAS 247',
  'MB Bank',
  'Email',
  'Apple Pay',
  'AI',
  '{size} GB',
  '{percent}%',
  'Nước mía',
  'Xôi',
  'Vietcombank',
  'MoMo',
  'CSV · Sheets',
  // Mail services and iOS apps keep their names.
  'Outlook.com',
  'iCloud Mail',
  'Mail',
  // The companions keep their Vietnamese names in English.
  'Nhang',
  'Bánh Bao',
  'Giọt',
  'Hạc Giấy',
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

/**
 * Everything wrong with a platform's wording measured against the catalogue it varies, in one
 * language: a key the catalogue lacks, a plural shape or parameters that differ, an empty string,
 * or wording no different from the catalogue's.
 */
export function findVariantProblems(catalogue: LooseCatalogue, variants: LooseCatalogue): string[] {
  const problems: string[] = [];
  for (const [key, entry] of Object.entries(variants)) {
    const base = catalogue[key];
    if (base === undefined) {
      problems.push(`${key}: not in the catalogue`);
      continue;
    }
    if ((typeof entry === 'string') !== (typeof base === 'string')) {
      problems.push(`${key}: plural in one of them only`);
      continue;
    }
    const expected = paramNames(base).join(', ');
    const actual = paramNames(entry).join(', ');
    if (expected !== actual) {
      problems.push(`${key}: parameters differ ({${expected}} against {${actual}})`);
    }
    if (texts(entry).some((text) => text.trim() === '')) problems.push(`${key}: empty wording`);
    if (texts(entry).join('\n') === texts(base).join('\n')) {
      problems.push(`${key}: the same as the catalogue`);
    }
  }
  return problems;
}
