import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import type { CashChip } from './close-steps';
import type { useClose } from './use-close';

/**
 * The close's cash step: the quick chips, the category a chip files under, and adding a cash
 * spend (tapped, typed or said) to the day being closed.
 */
export function useCloseCash(close: ReturnType<typeof useClose>) {
  const { t } = useI18n();
  const snap = useMoney();
  const actions = useMoneyActions();

  const chips: CashChip[] = [
    { key: 'transport', name: t('close.cash.parking'), amount: 5_000 },
    { key: 'drinks', name: t('close.cash.sugarcane'), amount: 10_000 },
    { key: 'food', name: t('close.cash.xoi'), amount: 20_000 },
    { key: 'groceries', name: t('close.cash.market'), amount: 50_000 },
  ];
  const categoryFor = (key: string) =>
    snap.categories.find((c) => c.id === key)?.id ?? snap.categories[0]?.id ?? key;

  const addCash = (
    name: string,
    amount: number,
    categoryId: string,
    key: string,
    source: 'cash' | 'voice' = 'cash',
  ) => {
    haptics.tap();
    close.setCash((c) => [...c, { key, name, amount }]);
    void close.run(async () => {
      // A merchant the user taught 6pm keeps its category, as everywhere else.
      const learned = await actions.ruleCategory(name);
      await actions.addSpend({
        amount,
        categoryId: learned ?? categoryId,
        merchant: name,
        source,
        status: 'kept',
        wallet: 'Cash',
        // Cash handed over while closing a day belongs to that day, even past 04:00.
        day: close.day,
      });
    });
  };

  return { chips, categoryFor, addCash };
}
