import type { Entry } from './catalogue-types';
import type { enShareExt } from './en-share-ext';

export const viShareExt: { readonly [Key in keyof typeof enShareExt]: Entry } = {};
