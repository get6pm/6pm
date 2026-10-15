import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  goalEntryOf,
  goalEntryValue,
  goalUnitFits,
  goalUnitsFor,
  goalUnitTakesDecimals,
  pressGoalKey,
  setGoalUnit,
  type GoalEntry,
  type GoalKey,
  type GoalUnit,
  type Vnd,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { useSheetMoney } from './sheet-money';

const KEYS: readonly GoalKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

/** How typed digits are written: đồng the design's way ("1.500,25"), else the phone's way. */
interface Marks {
  readonly group: string;
  readonly decimal: string;
}

const DONG_MARKS: Marks = { group: '.', decimal: ',' };

/** "1.500" and "1.500,25": the whole part grouped, the decimals after the decimal mark. */
function typed(digits: string, marks: Marks): string {
  const [whole = '', fraction] = digits.split('.');
  const grouped = String(Number(whole || '0')).replace(/\B(?=(\d{3})+(?!\d))/g, marks.group);
  return fraction === undefined ? grouped : `${grouped}${marks.decimal}${fraction}`;
}

/**
 * The goal's amount, typed: chips of goals that suit the pot, the number with its unit (nghìn,
 * triệu, tỷ; or the currency's own, thousand, million) and the exact amount under it, the unit
 * row, and a keypad. The first key after opening or after a chip starts over, so a new number
 * never lands after the old one.
 */
export function GoalAmountEditor({
  goal,
  presets,
  onChange,
  currency: code,
}: {
  readonly goal: Vnd;
  readonly presets: readonly Vnd[];
  readonly onChange: (goal: Vnd) => void;
  /** The pot's own currency (ISO code), when it is not the home currency. */
  readonly currency?: string | undefined;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useSheetMoney(code);
  const currency = money.currency;
  const dong = currency.code === 'VND';
  const marks = dong ? DONG_MARKS : money.locale;
  const [entry, setEntry] = useState<GoalEntry>(() => goalEntryOf(goal, currency));
  const [fresh, setFresh] = useState(true);
  const value = goalEntryValue(entry, currency);

  // A goal set from outside (a template) replaces what is shown; typing only ever echoes back.
  useEffect(() => {
    setEntry((e) => (goalEntryValue(e, currency) === goal ? e : goalEntryOf(goal, currency)));
  }, [goal, currency]);

  const set = (next: GoalEntry) => {
    setEntry(next);
    setFresh(false);
    onChange(goalEntryValue(next, currency));
  };
  const pick = (amount: Vnd) => {
    haptics.tick();
    setEntry(goalEntryOf(amount, currency));
    setFresh(true);
    onChange(amount);
  };
  // The first unit is đồng's own word, or the currency's symbol.
  const unitLabel = (unit: GoalUnit) =>
    unit !== 'whole'
      ? t(`plan.pot.unit.${unit}`)
      : dong
        ? t('plan.pot.unit.dong')
        : currency.symbol;
  const noPoint = !goalUnitTakesDecimals(entry.unit, currency);

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {presets.map((amount) => {
          const on = amount === value;
          return (
            <PressScale
              key={amount}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => pick(amount)}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 99,
                backgroundColor: on ? palette.btnBg : palette.chipBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ ...body(13, 650), color: on ? palette.btnFg : palette.ink }}
              >
                {money.short(amount)}
              </Text>
            </PressScale>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', gap: 2, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              ...display(40, 500, -0.02),
              ...tabular,
              lineHeight: 46,
              color: palette.ink,
              opacity: fresh || entry.digits === '' ? 0.5 : 1,
            }}
          >
            {typed(entry.digits, marks)}
          </Text>
          <Text style={{ ...body(20, 600), color: palette.inkSoft }}>{unitLabel(entry.unit)}</Text>
        </View>
        <Text style={{ ...body(13), ...tabular, color: palette.inkSoft }}>{money.full(value)}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          padding: 3,
          gap: 3,
          borderRadius: 13,
          backgroundColor: palette.chipBg,
        }}
      >
        {goalUnitsFor(currency).map((unit) => {
          const on = unit === entry.unit;
          const fits = goalUnitFits(entry, unit, currency);
          return (
            <PressScale
              key={unit}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !fits }}
              disabled={!fits}
              onPress={() => {
                haptics.tick();
                set(setGoalUnit(entry, unit, currency));
              }}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 10,
                backgroundColor: on ? palette.cell : 'transparent',
                boxShadow: on ? palette.cardShadow : undefined,
                opacity: fits ? 1 : 0.3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(13.5, on ? 650 : 500), color: palette.ink }}>
                {unitLabel(unit)}
              </Text>
            </PressScale>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {KEYS.map((key) => (
          <PressScale
            key={key}
            scaleTo={0.92}
            accessibilityRole="keyboardkey"
            {...(key === 'back'
              ? { accessibilityLabel: t('plan.pot.key.back') }
              : key === '.'
                ? { accessibilityLabel: t('plan.pot.key.decimal') }
                : {})}
            onPress={() => {
              haptics.tick();
              set(pressGoalKey(entry, key, fresh, currency));
            }}
            {...(key === 'back'
              ? {
                  onLongPress: () => {
                    haptics.tap();
                    set({ ...entry, digits: '' });
                  },
                }
              : {})}
            style={{
              width: '32.2%',
              flexGrow: 1,
              height: 48,
              borderRadius: 15,
              backgroundColor: palette.chipBg,
              opacity: key === '.' && noPoint ? 0.3 : 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {key === 'back' ? (
              <Symbol name="backspace" size={22} color={palette.ink} />
            ) : (
              <Text style={{ ...display(24, 500), color: palette.ink }}>
                {key === '.' ? marks.decimal : key}
              </Text>
            )}
          </PressScale>
        ))}
      </View>
    </Animated.View>
  );
}
