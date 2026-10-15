import { Text, type TextStyle } from 'react-native';

import { steps, type Currency } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { display } from '../../ui/type/fonts';
import { symbolStyle } from '../../ui/type/symbol-face';
import { groupMarkOf, millionsPlace } from './onboarding-maths';

/** How many steps each wheel counts: the lead, the "millions", the hundreds and a bill's tens. */
const WHEEL_STEPS = { lead: 100_000, millions: 1000, hundreds: 100, tens: 10 } as const;
export type WheelUnit = keyof typeof WHEEL_STEPS;
/** The design's names for the đồng wheels. */
type DongWheelKey =
  | 'onboarding.income.hundredMillions'
  | 'onboarding.income.millions'
  | 'onboarding.income.hundreds'
  | 'onboarding.bills.millions'
  | 'onboarding.bills.hundreds'
  | 'onboarding.bills.tens';

export interface WheelMoney {
  readonly currency: Currency;
  /** The thousands mark, as the home currency is written. */
  readonly mark: string;
  /** Where the "millions" wheel's last digit sits, counted from the right. */
  readonly place: number;
  /** The symbol before the wheels ("$"), or empty. */
  readonly before: string;
  /** The symbol after the wheels ("₫", "€"), or empty. */
  readonly after: string;
  /** A wheel's spoken name: the design's own in đồng, else the amount one row is worth. */
  readonly label: (unit: WheelUnit, dongKey: DongWheelKey) => string;
}

/** What the money wheels need to read as the home currency is written. */
export function useWheelMoney(): WheelMoney {
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { currency } = money;
  const parts = money.parts(steps(1000, currency));
  return {
    currency,
    mark: groupMarkOf(money),
    place: millionsPlace(currency),
    before: parts.prefix.trim(),
    after: parts.suffix.trim(),
    label: (unit, dongKey) =>
      currency.code === 'VND'
        ? t(dongKey)
        : t('onboarding.wheel.unit', { amount: money.full(steps(WHEEL_STEPS[unit], currency)) }),
  };
}

/**
 * The symbol beside the wheels: small, soft and raised, after them for ₫ and €, before them for
 * $. `offset` is how far below the wheels' top it sits, as the design sets ₫.
 */
export function WheelSymbol({
  symbol,
  size,
  offset,
  ink,
  side,
}: {
  readonly symbol: string;
  readonly size: number;
  readonly offset: number;
  readonly ink: string;
  readonly side: 'before' | 'after';
}) {
  if (symbol === '') return null;
  const style: TextStyle = {
    ...symbolStyle(display(size, 600), symbol),
    color: ink,
    opacity: 0.55,
    alignSelf: 'flex-start',
    marginTop: offset,
    ...(side === 'after' ? { marginLeft: 4 } : { marginRight: 4 }),
  };
  return <Text style={style}>{symbol}</Text>;
}
