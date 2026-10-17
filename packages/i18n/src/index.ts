// String catalogues for English and Vietnamese.
export { languages, platforms } from './catalogue-types';
export type { Language, ParamsArgument, ParamsOf, Platform, StringKey } from './catalogue-types';
export { defaultLanguage, isLanguage, pickLanguage } from './pick-language';
export { t, translatorFor } from './translate';
