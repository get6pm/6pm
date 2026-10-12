import type { Entry } from './catalogue-types';
import type { enSharing } from './en-sharing';

export const viSharing: { readonly [Key in keyof typeof enSharing]: Entry } = {};
