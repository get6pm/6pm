import type { Entry } from './catalogue-types';
import type { enVoice } from './en-voice';

export const viVoice: { readonly [Key in keyof typeof enVoice]: Entry } = {};
