import { Text, View } from 'react-native';

import { formatShort, type Payday } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { body } from '../../ui/type/fonts';
import { IncomeWheels, PaydayPicker } from './money-in-controls';
import type { OnboardingPalette } from './onboarding-palette';
import { Card, StepHeading } from './step-parts';

/** Money in: millions and hundred thousands on two wheels, then when it lands. */
export function StepMoneyIn({
  pal,
  income,
  payday,
  sameDay,
  dailyHint,
  onIncome,
  onPayday,
}: {
  readonly pal: OnboardingPalette;
  readonly income: number;
  readonly payday: Payday;
  /** The day wheel's value, kept while another payday kind is chosen. */
  readonly sameDay: number;
  /** Money in alone, spread over the days to payday by the domain engine. */
  readonly dailyHint: number;
  readonly onIncome: (income: number) => void;
  readonly onPayday: (payday: Payday) => void;
}) {
  const { t, language } = useI18n();
  return (
    <View style={{ gap: 14 }}>
      <StepHeading
        title={t('onboarding.income.title')}
        sub={t('onboarding.income.sub')}
        pal={pal}
      />
      <Card pal={pal} style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14, gap: 6 }}>
        <IncomeWheels income={income} onIncome={onIncome} colours={pal} />
        <Text style={{ ...body(13), textAlign: 'center', color: pal.inkSoft }}>
          {t('onboarding.income.daily', { amount: formatShort(dailyHint, language) })}
        </Text>
      </Card>
      <Card pal={pal} style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
        <Text style={{ ...body(15, 650), color: pal.ink }}>{t('onboarding.payday.title')}</Text>
        <PaydayPicker payday={payday} sameDay={sameDay} onPayday={onPayday} colours={pal} />
      </Card>
    </View>
  );
}
