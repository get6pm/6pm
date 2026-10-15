import { designAmount, formatShort, type MoneyFormat } from '@6pm/domain';
import type { ParamsArgument, StringKey } from '@6pm/i18n';

type Say = <Key extends StringKey>(key: Key, ...params: ParamsArgument<Key>) => string;

/** The design's example prices (a 2tr dinner, a 450k jacket), at their worth in the home currency. */
export function askExamples(money: MoneyFormat): {
  readonly dinner: string;
  readonly jacket: string;
} {
  const { currency } = money;
  return {
    dinner: money.short(designAmount(2_000_000, currency)),
    jacket: money.short(designAmount(450_000, currency)),
  };
}

/**
 * The price a goal question is asked to name: "3 tỷ" in đồng, in either language, as people say
 * it; elsewhere the design's 3 tỷ at its worth ("$100k").
 */
export function goalPriceExample(money: MoneyFormat): string {
  const { currency } = money;
  return currency.code === 'VND'
    ? formatShort(3_000_000_000, 'vi')
    : money.short(designAmount(3_000_000_000, currency));
}

/** The prototype's questions offered as taps: the pot's one only when there is a pot to ask about. */
export function askSuggestions(t: Say, firstPotName: string | null, money: MoneyFormat): string[] {
  const examples = askExamples(money);
  return [
    t('ask.suggest.afford', { amount: examples.dinner }),
    t('ask.suggest.weekend'),
    t('ask.suggest.spend', { amount: examples.jacket }),
    ...(firstPotName === null ? [] : [t('ask.suggest.pot', { pot: firstPotName })]),
    t('ask.suggest.save'),
  ];
}
