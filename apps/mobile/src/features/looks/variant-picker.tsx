import { Text, View } from 'react-native';

import { swatchesFor, type LookId } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** A look's three variants as swatch triples; the chosen one is ringed (prototype `App:937-945`). */
export function VariantPicker({
  look,
  names,
  selected,
  onPick,
}: {
  readonly look: LookId;
  /** The variants' names, in the app's language. */
  readonly names: readonly string[];
  readonly selected: number;
  readonly onPick: (index: number) => void;
}) {
  const { palette } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
      {names.map((name, index) => {
        const on = index === selected;
        const colours = swatchesFor(look, index);
        return (
          <PressScale
            key={name}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={name}
            onPress={() => {
              haptics.tick();
              onPick(index);
            }}
            style={{
              flex: 1,
              minHeight: 72,
              paddingTop: 12,
              paddingHorizontal: 6,
              paddingBottom: 10,
              borderRadius: 16,
              backgroundColor: palette.cell,
              boxShadow: on ? `0 0 0 2px ${palette.ink}` : `inset 0 0 0 0.5px ${palette.hair}`,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              {colours.slice(0, 3).map((colour, i) => (
                <View
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    marginLeft: i === 0 ? 0 : -6,
                    backgroundColor: colour,
                    boxShadow: `0 0 0 2px ${palette.cell}`,
                  }}
                />
              ))}
            </View>
            <Text numberOfLines={1} style={{ ...body(12.5, on ? 700 : 500), color: palette.ink }}>
              {name}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
