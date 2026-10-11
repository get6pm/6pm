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

/**
 * The money keypad: digits, "k" for thousands, "000", and delete, in four columns of 48 pt keys.
 * Scan draws it on its paper card, so the inks can be given; elsewhere they follow the look.
 */
export function Keypad({
  onPress,
  ink,
  keyBg,
}: {
  readonly onPress: (key: KeypadKey) => void;
  readonly ink?: string;
  readonly keyBg?: string;
}) {
  const { palette } = useTheme();
  const color = ink ?? palette.ink;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {KEYS.map((key, i) =>
        key === null ? (
          <View key={i} style={{ width: '23.5%', height: 48 }} />
        ) : (
          <PressScale
            key={key}
            scaleTo={0.92}
            accessibilityRole="keyboardkey"
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
                {key}
              </Text>
            )}
          </PressScale>
        ),
      )}
    </View>
  );
}
