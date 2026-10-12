import { Text, View } from 'react-native';

import type { KeypadKey } from '@6pm/domain';

import { haptics } from './haptics';
import { Symbol } from './icons/symbol';
import { PressScale } from './primitives/press-scale';
import { useTheme } from './theme/theme';
import { body, display } from './type/fonts';

const KEYS: (KeypadKey | null)[] = [
  '1',
  '2',
  '3',
  'back',
  '4',
  '5',
  '6',
  'k',
  '7',
  '8',
  '9',
  '000',
  null,
  '0',
  null,
  null,
];

/** Abroad: the key that flips between đồng and the local currency, and a decimal key if it has cents. */
export interface KeypadCurrencyKey {
  /** The symbol of the currency the key switches to. */
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly decimal: boolean;
}

function keysFor(currency: KeypadCurrencyKey | undefined): readonly (KeypadKey | null)[] {
  if (currency === undefined) return KEYS;
  return KEYS.map((key, i) => (i === 12 && currency.decimal ? '.' : i === 14 ? 'currency' : key));
}

/**
 * The money keypad: digits, "k" for thousands, "000", and delete, in four columns of 48 pt keys.
 * Abroad, the empty cells of the last row hold a decimal comma and the currency key.
 * Scan draws it on its paper card, so the inks can be given; elsewhere they follow the look.
 */
export function Keypad({
  onPress,
  ink,
  keyBg,
  currency,
}: {
  readonly onPress: (key: KeypadKey) => void;
  readonly ink?: string;
  readonly keyBg?: string;
  readonly currency?: KeypadCurrencyKey;
}) {
  const { palette } = useTheme();
  const color = ink ?? palette.ink;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {keysFor(currency).map((key, i) =>
        key === null ? (
          <View key={i} style={{ width: '23.5%', height: 48 }} />
        ) : (
          <PressScale
            key={key}
            scaleTo={0.92}
            accessibilityRole="keyboardkey"
            {...(key === 'currency' && currency
              ? { accessibilityLabel: currency.accessibilityLabel }
              : {})}
            onPress={() => {
              haptics.tick();
              onPress(key);
            }}
            style={{
              width: '23.5%',
              height: 48,
              borderRadius: 15,
              backgroundColor: keyBg ?? palette.chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {key === 'back' ? (
              <Symbol name="backspace" size={22} color={color} />
            ) : (
              <Text
                style={{
                  ...(/\d/.test(key) && key.length === 1 ? display(24, 500) : body(17, 650)),
                  color,
                }}
              >
                {key === 'currency' ? (currency?.label ?? '') : key === '.' ? ',' : key}
              </Text>
            )}
          </PressScale>
        ),
      )}
    </View>
  );
}
