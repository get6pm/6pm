import { ScrollView, Text, View } from 'react-native';

import { swatchesFor, type LookId } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/**
 * A look's variants as a row of pills, each with its colours swept into one disc; the chosen one
 * is filled and ringed (prototype `App:988-995`). The row scrolls sideways when the names are long.
 */
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      style={{ marginHorizontal: -18, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 3, gap: 6 }}
    >
      {names.map((name, index) => {
        const on = index === selected;
        const [a, b, c] = swatchesFor(look, index);
        return (
          <PressScale
            key={name}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={name}
            scaleTo={0.96}
            inScroll
            onPress={() => {
              haptics.tick();
              onPick(index);
            }}
            style={{
              height: 38,
              paddingVertical: 3,
              paddingLeft: 3,
              paddingRight: 12,
              borderRadius: 99,
              backgroundColor: on ? palette.btnBg : palette.chipBg,
              boxShadow: on
                ? `0 0 0 2px ${palette.sheetSolid}, 0 0 0 4px ${palette.ink}`
                : `inset 0 0 0 0.5px ${palette.hair}`,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundImage: `linear-gradient(135deg, ${a} 0%, ${b} 55%, ${c} 100%)`,
                boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,.12)',
              }}
            />
            <Text
              numberOfLines={1}
              style={{ ...body(13, on ? 700 : 500), color: on ? palette.btnFg : palette.ink }}
            >
              {name}
            </Text>
          </PressScale>
        );
      })}
    </ScrollView>
  );
}
