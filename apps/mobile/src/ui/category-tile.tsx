import { View } from 'react-native';

import { categoryTile } from '@6pm/theme';

import { Symbol } from './icons/symbol';
import type { SymbolName } from './icons/symbols.generated';

/**
 * The glossy rounded tile that carries a category's or merchant's icon: two tints of the
 * category's hue at 155°, a lit top edge and a soft drop, the filled glyph in the deep tint.
 */
export function CategoryTile({
  icon,
  hue,
  size = 38,
  radius = 13,
  glyph = 21,
}: {
  readonly icon: SymbolName;
  readonly hue: number;
  readonly size?: number;
  readonly radius?: number;
  readonly glyph?: number;
}) {
  const tile = categoryTile(hue);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 0 rgba(60,20,40,.08), 0 3px 8px rgba(30,10,40,.14)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={glyph} fill={1} weight={500} color={tile.glyph} />
    </View>
  );
}
