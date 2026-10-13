import { Text, View } from 'react-native';

import type { CategoryRow } from '@6pm/domain';

import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** The spend's category as a wrap of chips; picking another one files the spend there. */
export function CategoryChips({
  categories,
  selected,
  onPick,
}: {
  readonly categories: readonly CategoryRow[];
  readonly selected: string;
  readonly onPick: (categoryId: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 12,
      }}
    >
      {categories.map((c) => {
        const on = c.id === selected;
        return (
          <PressScale
            key={c.id}
            onPress={() => {
              if (on) return;
              haptics.tick();
              onPick(c.id);
            }}
            style={{
              height: 34,
              paddingLeft: 9,
              paddingRight: 12,
              borderRadius: 99,
              backgroundColor: on ? palette.btnBg : palette.chipBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {isSymbolName(c.icon) ? (
              <Symbol name={c.icon} size={17} fill={1} color={on ? palette.btnFg : palette.ink} />
            ) : null}
            <Text style={{ ...body(13, 600), color: on ? palette.btnFg : palette.ink }}>
              {c.name}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
