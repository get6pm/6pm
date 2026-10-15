import { Text, type TextProps, type TextStyle } from 'react-native';

import type { MoneyParts } from '@6pm/domain';

import { symbolStyle } from '../../ui/type/symbol-face';

/**
 * A big amount as one line of text, its currency symbol on its own side ("45.000₫", "$12.50",
 * "12,50 €") and set in a face that draws it. `symbol` restyles the symbol (smaller, softer), and
 * `gap` replaces the space between symbol and number when the design asks for its own.
 */
export function AmountText({
  parts,
  style,
  symbol,
  gap,
  ...rest
}: Omit<TextProps, 'style' | 'children'> & {
  readonly parts: MoneyParts;
  readonly style: TextStyle;
  readonly symbol?: TextStyle;
  readonly gap?: string;
}) {
  const before = parts.prefix.trim();
  const after = parts.suffix.trim();
  const mark = (glyphs: string, text: string) => {
    const own = symbolStyle({ ...style, ...symbol }, glyphs);
    // Nested text inherits the face: one that cannot draw the symbol is replaced by name.
    const face = own.fontFamily === undefined && style.fontFamily ? { fontFamily: 'System' } : {};
    return <Text style={{ ...own, ...face }}>{text}</Text>;
  };
  return (
    <Text style={style} {...rest}>
      {parts.sign}
      {before ? mark(before, gap === undefined ? parts.prefix : before + gap) : null}
      {parts.number}
      {after ? mark(after, gap === undefined ? parts.suffix : gap + after) : null}
    </Text>
  );
}
