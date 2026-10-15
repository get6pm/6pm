import { steps } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
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
  const home = useHomeCurrency();

  // The design's 5.000₫, 10.000₫, 20.000₫ and 50.000₫, named for Vietnamese life in đồng and
  // plainly elsewhere.
  const vietnam = home.code === 'VND';
  const chips: CashChip[] = [
    {
      key: 'transport',
      name: t(vietnam ? 'close.cash.parking' : 'close.cash.fare'),
      amount: steps(5, home),
    },
    {
      key: 'drinks',
      name: t(vietnam ? 'close.cash.sugarcane' : 'close.cash.coffee'),
      amount: steps(10, home),
    },
    {
      key: 'food',
      name: t(vietnam ? 'close.cash.xoi' : 'close.cash.snack'),
      amount: steps(20, home),
    },
    {
      key: 'groceries',
      name: t(vietnam ? 'close.cash.market' : 'close.cash.groceries'),
      amount: steps(50, home),
    },
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
