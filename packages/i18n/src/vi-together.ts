import type { Entry } from './catalogue-types';
import type { enTogether } from './en-together';

export const viTogether: { readonly [Key in keyof typeof enTogether]: Entry } = {};
