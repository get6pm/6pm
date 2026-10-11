/**
 * The facts the legal pages share. `OWNER` and `CONTACT_EMAIL` fill the `{{OWNER}}` and
 * `{{CONTACT_EMAIL}}` tokens in the documents under `src/legal`; set them here, once, when the
 * operating entity and the contact address are decided.
 */
export const OWNER = '{{OWNER}}';
export const CONTACT_EMAIL = '{{CONTACT_EMAIL}}';

export type LegalLang = 'en' | 'vi';
export type LegalSlug = 'privacy' | 'terms';

export const legalLangs: readonly LegalLang[] = ['en', 'vi'];
export const legalSlugs: readonly LegalSlug[] = ['privacy', 'terms'];

/** English lives at the site root, Vietnamese under `/vi`. */
export function legalPath(lang: LegalLang, slug: LegalSlug): string {
  return lang === 'en' ? `/${slug}` : `/vi/${slug}`;
}

interface LegalStrings {
  readonly brandLabel: string;
  readonly updated: string;
  readonly contents: string;
  readonly privacy: string;
  readonly terms: string;
  /** Names the other language, in that language. */
  readonly otherLanguage: string;
  readonly otherLanguageLabel: string;
  readonly rights: string;
  /** The date as the page prints it. */
  readonly formatDate: (iso: string) => string;
}

const monthsEn = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function dateParts(iso: string): readonly [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) throw new Error(`A legal page date must be YYYY-MM-DD, not "${iso}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export const legalStrings: Readonly<Record<LegalLang, LegalStrings>> = {
  en: {
    brandLabel: '6pm, home',
    updated: 'Last updated',
    contents: 'On this page',
    privacy: 'Privacy',
    terms: 'Terms',
    otherLanguage: 'Tiếng Việt',
    otherLanguageLabel: 'Đọc bằng tiếng Việt',
    rights: '© 2026',
    formatDate: (iso) => {
      const [year, month, day] = dateParts(iso);
      return `${day} ${monthsEn[month - 1]} ${year}`;
    },
  },
  vi: {
    brandLabel: '6pm, trang chủ',
    updated: 'Cập nhật lần cuối',
    contents: 'Nội dung',
    privacy: 'Quyền riêng tư',
    terms: 'Điều khoản',
    otherLanguage: 'English',
    otherLanguageLabel: 'Read in English',
    rights: '© 2026',
    formatDate: (iso) => {
      const [year, month, day] = dateParts(iso);
      return `${day} tháng ${month}, ${year}`;
    },
  },
};
