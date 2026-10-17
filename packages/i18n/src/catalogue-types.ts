import type { en } from './en';

export const languages = ['en', 'vi'] as const;
export type Language = (typeof languages)[number];

/**
 * A string that changes with a number. `other` is always present; a language adds only the
 * categories its plural rules use (English adds `one`, Vietnamese adds none).
 */
export type PluralForms = { readonly other: string } & {
  readonly [Category in Exclude<Intl.LDMLPluralRule, 'other'>]?: string;
};

export type Entry = string | PluralForms;

export type StringKey = keyof typeof en;

/** Every language carries exactly the English key set. */
export type Catalogue = { readonly [Key in StringKey]: Entry };

type ParamNames<Text extends string> = Text extends `${string}{${infer Name}}${infer Rest}`
  ? Name | ParamNames<Rest>
  : never;

type EntryParamNames<E> = E extends string
  ? ParamNames<E>
  : E extends PluralForms
    ? 'count' | ParamNames<Extract<E[keyof E], string>>
    : never;

/** The parameters a key needs, read from the `{name}` placeholders of its English text. */
export type ParamsOf<Key extends StringKey> = {
  readonly [Name in EntryParamNames<(typeof en)[Key]>]: Name extends 'count'
    ? number
    : string | number;
};

/** Keys with no placeholders take no third argument; the others require it. */
export type ParamsArgument<Key extends StringKey> = [keyof ParamsOf<Key>] extends [never]
  ? []
  : [params: ParamsOf<Key>];

/** The phones 6pm runs on. The catalogues are written for iPhone; Android words a few keys its own way. */
export const platforms = ['ios', 'android'] as const;
export type Platform = (typeof platforms)[number];

/**
 * A platform's own wording for the keys that would not be true on it as the catalogue writes them
 * (the iPhone by name, Apple's services, places 6pm cannot reach there). Every other key reads as
 * the catalogue has it.
 */
export type Variants = { readonly [Key in StringKey]?: Entry };
