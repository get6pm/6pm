import { useMemo } from 'react';

import { currencyOf, type Currency, type MoneyFormat } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { moneyFormatFor } from '../../money/use-money-format';

export interface PotMoney {
  readonly currency: Currency;
  readonly money: MoneyFormat;
}

/**
 * A shared pot's money is written in the pot's own currency, which is its maker's home currency
 * and may not be this phone's.
 */
export function usePotMoney(code: string): PotMoney {
  const { language } = useI18n();
  return useMemo(() => {
    const currency = currencyOf(code);
    return { currency, money: moneyFormatFor(currency, language) };
  }, [code, language]);
}
