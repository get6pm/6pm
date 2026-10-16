import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { body } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { AmountWheels, CardTop, Pill, Question } from './bill-card-parts';
import { billName } from './bill-copy';
import {
  DEFAULT_DUE_DAY,
  DEFAULT_MONTHS_LEFT,
  MAX_MONTHS_LEFT,
  type BillAnswers,
  type DeckItem,
} from './bill-deck';
import { DayOfMonthWheel } from './money-in-controls';
import type { OnboardingPalette } from './onboarding-palette';
import { WheelBand } from './step-parts';

/** Two digits at the wheel's size: narrow, so three wheels fit a phone's card in one row. */
const MONTHS_WIDTH = 44;
const MONTHS = Array.from({ length: MAX_MONTHS_LEFT }, (_, i) => String(i + 1));

/** Payments still to go on a bill that ends, 1 to 60. */
export function MonthsLeftWheel({
  months,
  onMonths,
  label,
  colours,
}: {
  readonly months: number;
  readonly onMonths: (months: number) => void;
  readonly label: string;
  readonly colours: { readonly ink: string; readonly chipBg: string };
}) {
  return (
    <View style={{ width: MONTHS_WIDTH, justifyContent: 'center' }}>
      <WheelBand height={34} radius={11} color={colours.chipBg} />
      <Wheel
        items={MONTHS}
        index={Math.min(MAX_MONTHS_LEFT, Math.max(1, months)) - 1}
        onChange={(k) => onMonths(k + 1)}
        size={22}
        ink={colours.ink}
        width={MONTHS_WIDTH}
        label={label}
      />
    </View>
  );
}

/** A small wheel with its name under it. */
function Labelled({
  label,
  ink,
  children,
}: {
  readonly label: string;
  readonly ink: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {children}
      <Text style={{ ...body(11.5, 600), color: ink }}>{label}</Text>
    </View>
  );
}

/**
 * A bill's amount card: what it costs each month and the day it is due, and for a bill that ends
 * (trả góp) how many months are left. A card's says in one line that it is only what pays off an
 * old balance.
 */
export function BillAmountFace({
  item,
  deckIndex,
  answers,
  pal,
  face,
  buttonHeight,
  onAnswers,
  onGo,
  onQuestionBottom,
  onWheelsHeight,
}: {
  readonly item: DeckItem & { readonly type: 'amount' };
  readonly deckIndex: number;
  readonly answers: BillAnswers;
  readonly pal: OnboardingPalette;
  readonly face: ComponentProps<typeof View>['style'];
  readonly buttonHeight: number;
  readonly onAnswers: (next: BillAnswers) => void;
  readonly onGo: (index: number, direction: 1 | -1) => void;
  readonly onQuestionBottom: (y: number) => void;
  readonly onWheelsHeight: (height: number) => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const money = useMoneyFormat();
  const name = billName(i18n, item.card, item.option);
  const value = answers.amounts[item.key] ?? 0;
  const dueDay = answers.dueDays[item.key] ?? DEFAULT_DUE_DAY;
  const months = answers.monthsLeft?.[item.key] ?? DEFAULT_MONTHS_LEFT;
  const setValue = (next: number) =>
    onAnswers({ ...answers, amounts: { ...answers.amounts, [item.key]: next } });
  const setDueDay = (next: number) =>
    onAnswers({ ...answers, dueDays: { ...answers.dueDays, [item.key]: next } });
  const setMonths = (next: number) =>
    onAnswers({ ...answers, monthsLeft: { ...answers.monthsLeft, [item.key]: next } });
  return (
    <View style={face}>
      <CardTop item={item} pal={pal} />
      <Question
        q={t('onboarding.bills.amountQ', { name })}
        sub={
          item.option?.kind === 'card'
            ? t('onboarding.bills.cardSub')
            : t('onboarding.bills.amountSub')
        }
        pal={pal}
        onBottom={onQuestionBottom}
      />
      <View
        onLayout={(e) => onWheelsHeight(e.nativeEvent.layout.height)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: item.option?.ends ? 4 : 8,
        }}
      >
        <AmountWheels value={value} ink={pal.ink} band={pal.chipBg} onValue={setValue} />
        <Labelled label={t('onboarding.bills.dueDay')} ink={pal.inkSoft}>
          <DayOfMonthWheel
            day={dueDay}
            onDay={setDueDay}
            label={t('onboarding.bills.dueDay')}
            colours={pal}
          />
        </Labelled>
        {item.option?.ends ? (
          <Labelled label={t('onboarding.bills.monthsLeft')} ink={pal.inkSoft}>
            <MonthsLeftWheel
              months={months}
              onMonths={setMonths}
              label={t('onboarding.bills.monthsLeft')}
              colours={pal}
            />
          </Labelled>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pill
          label={t('onboarding.bills.later')}
          bg={pal.accentClear}
          fg={pal.inkSoft}
          flex={1}
          height={44}
          onPress={() => {
            setValue(0);
            onGo(deckIndex + 1, 1);
          }}
        />
        <Pill
          label={
            value
              ? t('onboarding.bills.save', { amount: money.full(value) })
              : t('onboarding.bills.spin')
          }
          bg={value ? pal.btnBg : pal.chipBg}
          fg={value ? pal.btnFg : pal.inkSoft}
          flex={2}
          height={buttonHeight}
          onPress={() => {
            if (value) onGo(deckIndex + 1, 1);
          }}
        />
      </View>
    </View>
  );
}
