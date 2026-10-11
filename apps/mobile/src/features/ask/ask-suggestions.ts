import type { ParamsArgument, StringKey } from '@6pm/i18n';

/** The prototype's questions offered as taps: the pot's one only when there is a pot to ask about. */
export function askSuggestions(
  t: <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string,
  firstPotName: string | null,
): string[] {
  return [
    t('ask.suggest.afford'),
    t('ask.suggest.weekend'),
    t('ask.suggest.spend'),
    ...(firstPotName === null ? [] : [t('ask.suggest.pot', { pot: firstPotName })]),
    t('ask.suggest.save'),
  ];
}
