import type { Entry } from './catalogue-types';
import type { enSurfaces } from './en-surfaces';

export const viSurfaces: { readonly [Key in keyof typeof enSurfaces]: Entry } = {};
