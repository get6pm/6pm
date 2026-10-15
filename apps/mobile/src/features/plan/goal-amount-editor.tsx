import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  formatShort,
  formatVnd,
  GOAL_UNITS,
  goalEntryOf,
  goalEntryValue,
  goalUnitFits,
  groupDigits,
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

const KEYS: readonly GoalKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

/** "1.500" and "1.500,25": the whole part grouped with dots, the decimals after a comma. */
function typed(digits: string): string {
  const [whole = '', fraction] = digits.split('.');
  const grouped = groupDigits(Number(whole || '0'));
  return fraction === undefined ? grouped : `${grouped},${fraction}`;
}

/**
 * The goal's amount, typed: chips of goals that suit the pot, the number with its unit (nghìn,
 * triệu, tỷ) and the exact đồng under it, the unit row, and a keypad. The first key after opening
 * or after a chip starts over, so a new number never lands after the old one.
 */
export function GoalAmountEditor({
  goal,
  presets,
  onChange,
}: {
  readonly goal: Vnd;
  readonly presets: readonly Vnd[];
  readonly onChange: (goal: Vnd) => void;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const [entry, setEntry] = useState<GoalEntry>(() => goalEntryOf(goal));
  const [fresh, setFresh] = useState(true);
  const value = goalEntryValue(entry);

  // A goal set from outside (a template) replaces what is shown; typing only ever echoes back.
  useEffect(() => {
    setEntry((e) => (goalEntryValue(e) === goal ? e : goalEntryOf(goal)));
  }, [goal]);

  const set = (next: GoalEntry) => {
    setEntry(next);
    setFresh(false);
    onChange(goalEntryValue(next));
  };
  const pick = (amount: Vnd) => {
    haptics.tick();
    setEntry(goalEntryOf(amount));
    setFresh(true);
    onChange(amount);
  };
  const unitLabel = (unit: GoalUnit) => t(`plan.pot.unit.${unit}`);

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
                {formatShort(amount, language)}
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
            {typed(entry.digits)}
          </Text>
          <Text style={{ ...body(20, 600), color: palette.inkSoft }}>{unitLabel(entry.unit)}</Text>
        </View>
        <Text style={{ ...body(13), ...tabular, color: palette.inkSoft }}>{formatVnd(value)}</Text>
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
        {GOAL_UNITS.map((unit) => {
          const on = unit === entry.unit;
          const fits = goalUnitFits(entry, unit);
          return (
            <PressScale
              key={unit}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !fits }}
              disabled={!fits}
              onPress={() => {
                haptics.tick();
                set(setGoalUnit(entry, unit));
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
              set(pressGoalKey(entry, key, fresh));
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
              opacity: key === '.' && entry.unit === 'dong' ? 0.3 : 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {key === 'back' ? (
              <Symbol name="backspace" size={22} color={palette.ink} />
            ) : (
              <Text style={{ ...display(24, 500), color: palette.ink }}>
                {key === '.' ? ',' : key}
              </Text>
            )}
          </PressScale>
        ))}
      </View>
    </Animated.View>
  );
}
