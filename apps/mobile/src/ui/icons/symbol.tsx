import { Text, type StyleProp, type TextStyle } from 'react-native';

import { families } from '../type/fonts';
import { symbolCodepoints, type SymbolName } from './symbols.generated';

export interface SymbolProps {
  readonly name: SymbolName;
  /** Glyph size in points (the prototype's font-size). */
  readonly size?: number;
  readonly color?: string;
  /** 1 draws the filled glyph (active tab, tonight tile). */
  readonly fill?: 0 | 1;
  readonly weight?: number;
  readonly style?: StyleProp<TextStyle>;
}

/**
 * A Material Symbols Rounded glyph, drawn from the bundled variable font with the same axes the
 * prototype sets: optical size follows the size (clamped 20–48), weight 400 unless given.
 */
export function Symbol({ name, size = 24, color, fill = 0, weight = 400, style }: SymbolProps) {
  const opsz = Math.min(48, Math.max(20, size));
  return (
    <Text
      accessible={false}
      allowFontScaling={false}
      style={[
        {
          fontFamily: families.symbols,
          fontSize: size,
          lineHeight: size,
          width: size,
          height: size,
          textAlign: 'center',
          fontVariationSettings: `'FILL' ${fill}, 'opsz' ${opsz}, 'wght' ${weight}`,
          ...(color ? { color } : {}),
        },
        style,
      ]}
    >
      {String.fromCodePoint(symbolCodepoints[name])}
    </Text>
  );
}

/** True when a stored icon name is one the app ships (categories keep icon names as text). */
export function isSymbolName(name: string): name is SymbolName {
  return name in symbolCodepoints;
}
