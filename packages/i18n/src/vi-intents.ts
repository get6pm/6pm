import type { Entry } from './catalogue-types';
import type { enIntents } from './en-intents';

export const viIntents: { readonly [Key in keyof typeof enIntents]: Entry } = {};
