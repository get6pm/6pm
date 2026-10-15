import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  goalEntryOf,
  goalEntryValue,
  goalKeypadUnits,
  goalUnitFits,
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
import { potReflow } from './pot-rows';
import { FAINT, potSheetColours } from './pot-sheet-colours';
import { useSheetMoney } from './sheet-money';

/** The keypad's rows: three digits and a unit key each, then the decimal mark, 0 and delete. */
const DIGITS: readonly (readonly GoalKey[])[] = ['123', '456', '789'].map(
  (row) => [...row] as GoalKey[],
);
const GAP = 6;
const KEY_H = 48;
/** The unit column is .9 of a digit column. */
const UNIT_COL = 0.9;
const PRESETS = 4;

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
 * The goal's amount, typed: the number with its unit and the exact amount under it, what it costs
 * a month when the pot has a date, four goals that suit the pot, and one keypad whose right column
 * is the units (nghìn, triệu, tỷ; or the currency's own, thousand, million): type 2,5, then tap tỷ.
 * The first key after opening or after a chip starts over, so a new number never lands after the
 * old one.
 */
export function GoalAmountEditor({
  goal,
  presets,
  onChange,
  hue,
  hint,
  currency: code,
}: {
  readonly goal: Vnd;
  readonly presets: readonly Vnd[];
  readonly onChange: (goal: Vnd) => void;
  /** The pot's hue, for the cost line's tint. */
  readonly hue: number;
  /** What the typed goal costs a month to make its date; nothing without one. */
  readonly hint?: string | undefined;
  /** The pot's own currency (ISO code), when it is not the home currency. */
  readonly currency?: string | undefined;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useSheetMoney(code);
  const currency = money.currency;
  const dong = currency.code === 'VND';
  const marks = dong ? DONG_MARKS : money.locale;
  const colours = potSheetColours(palette, hue);
  const [entry, setEntry] = useState<GoalEntry>(() => goalEntryOf(goal, currency));
  const [fresh, setFresh] = useState(true);
  const [width, setWidth] = useState(0);
  const value = goalEntryValue(entry, currency);
  const units = goalKeypadUnits(currency);

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
  // Digit columns and the narrower unit column, as the prototype's grid lays them out.
  const col = width > 0 ? (width - GAP * 3) / (3 + UNIT_COL) : 0;
  const sized = (span: number) => (col > 0 ? { width: col * span + GAP * (span - 1) } : null);

  const digitKey = (key: GoalKey, span = 1) => (
    <PressScale
      key={key}
      scaleTo={0.92}
      accessibilityRole="keyboardkey"
      {...(key === '.' ? { accessibilityLabel: t('plan.pot.key.decimal') } : {})}
      onPress={() => {
        haptics.tick();
        set(pressGoalKey(entry, key, fresh, currency));
      }}
      style={[
        {
          height: KEY_H,
          borderRadius: 15,
          backgroundColor: palette.chipBg,
          opacity: key === '.' && noPoint ? 0.3 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sized(span),
      ]}
    >
      <Text style={{ ...display(24, 500), color: palette.ink }}>
        {key === '.' ? marks.decimal : key}
      </Text>
    </PressScale>
  );

  const unitKey = (unit: GoalUnit | undefined, row: number) => {
    if (unit === undefined) return <View key={`unit-${row}`} style={sized(UNIT_COL)} />;
    const on = unit === entry.unit;
    const fits = goalUnitFits(entry, unit, currency);
    return (
      <PressScale
        key={unit}
        scaleTo={0.92}
        accessibilityRole="button"
        accessibilityState={{ selected: on, disabled: !fits }}
        disabled={!fits}
        onPress={() => {
          haptics.tick();
          set(setGoalUnit(entry, unit, currency));
        }}
        style={[
          {
            height: KEY_H,
            borderRadius: 15,
            backgroundColor: on ? palette.btnBg : 'transparent',
            borderWidth: on ? 0 : 1,
            borderColor: colours.keyEdge,
            opacity: fits ? 1 : 0.3,
            alignItems: 'center',
            justifyContent: 'center',
          },
          sized(UNIT_COL),
        ]}
      >
        <Text style={{ ...body(14.5, 650), color: on ? palette.btnFg : palette.ink }}>
          {unitLabel(unit)}
        </Text>
      </PressScale>
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}
    >
      <View style={{ alignItems: 'center', gap: 4, paddingTop: 2, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              ...display(58, 500, -0.025),
              ...tabular,
              lineHeight: 62,
              color: palette.ink,
              opacity: entry.digits === '' ? 0.5 : 1,
            }}
          >
            {typed(entry.digits, marks)}
          </Text>
          <Text style={{ ...display(26, 500), color: palette.inkSoft, opacity: FAINT }}>
            {unitLabel(entry.unit)}
          </Text>
        </View>
        <Text style={{ ...body(13), ...tabular, color: palette.inkSoft, opacity: FAINT }}>
          {money.full(value)}
        </Text>
        {hint ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(140)}
            layout={potReflow}
            style={{
              marginTop: 6,
              height: 28,
              paddingHorizontal: 12,
              borderRadius: 99,
              backgroundColor: colours.fitBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Symbol name="calendar_month" size={15} color={colours.fitInk} />
            <Text numberOfLines={1} style={{ ...body(12.5, 650), color: colours.fitInk }}>
              {hint}
            </Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: GAP }}>
        {presets.slice(-PRESETS).map((amount) => {
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

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: GAP }}>
        {DIGITS.map((row, k) => (
          <View key={k} style={{ flexDirection: 'row', gap: GAP }}>
            {row.map((key) => digitKey(key))}
            {unitKey(units[k], k)}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {digitKey('.')}
          {digitKey('0', 2)}
          <PressScale
            scaleTo={0.92}
            accessibilityRole="keyboardkey"
            accessibilityLabel={t('plan.pot.key.back')}
            onPress={() => {
              haptics.tick();
              set(pressGoalKey(entry, 'back', fresh, currency));
            }}
            onLongPress={() => {
              haptics.tap();
              set({ ...entry, digits: '' });
            }}
            style={[
              { height: KEY_H, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
              sized(UNIT_COL),
            ]}
          >
            <Symbol name="backspace" size={22} color={palette.ink} />
          </PressScale>
        </View>
      </View>
    </Animated.View>
  );
}
