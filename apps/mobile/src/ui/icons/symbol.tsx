import { Text, type StyleProp, type TextStyle } from 'react-native';

import { families } from '../type/fonts';
import { symbolCodepoints, type SymbolName } from './symbols.generated';

/**
 * The font's vertical metrics, in em: every glyph is drawn on the full em square, but the line
 * reaches 1056/960 above the baseline and 96/960 below it. A line only one em tall keeps the
 * descent under the baseline and pushes the glyph up by a tenth of its size, so each icon is set
 * on its natural 1.2 em line and the spare tenth above and below is taken back with margins.
 */
const ASCENT = 1056 / 960;
const DESCENT = 96 / 960;
const LINE = ASCENT + DESCENT;
const SPARE = (LINE - 1) / 2;

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
          lineHeight: size * LINE,
          width: size,
          height: size * LINE,
          marginVertical: -size * SPARE,
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
