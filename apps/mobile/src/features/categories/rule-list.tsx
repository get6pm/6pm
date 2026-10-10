import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import type { CategoryRow } from '@6pm/domain';
import { categoryTile } from '@6pm/theme';

import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { rowLayout } from './category-list';

/** One learned merchant: "Grab → Transport", how it was learned, and × to forget it. */
export function RuleListRow({
  merchant,
  category,
  sub,
  removeLabel,
  first,
  onRemove,
}: {
  readonly merchant: string;
  readonly category: CategoryRow;
  readonly sub: string;
  readonly removeLabel: string;
  readonly first: boolean;
  readonly onRemove: () => void;
}) {
  const { palette } = useTheme();
  const tile = categoryTile(category.hue);
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOut.duration(180)}
      layout={rowLayout}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingLeft: 16,
        paddingRight: 8,
        borderTopWidth: 0.5,
        borderTopColor: first ? 'transparent' : palette.hair,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, ...body(15.5, 600), color: palette.ink }}>
            {merchant}
          </Text>
          <Symbol name="arrow_forward" size={16} color={palette.ink} style={{ opacity: 0.45 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 7,
                experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol
                name={isSymbolName(category.icon) ? category.icon : 'payments'}
                size={13}
                fill={1}
                color={tile.glyph}
              />
            </View>
            <Text numberOfLines={1} style={{ ...body(15.5, 600), color: palette.ink }}>
              {category.name}
            </Text>
          </View>
        </View>
        <Text style={{ ...body(12.5), color: palette.inkSoft }}>{sub}</Text>
      </View>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        onPress={onRemove}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="close" size={20} color={palette.inkSoft} />
      </PressScale>
    </Animated.View>
  );
}

/** "Nothing learned yet." inside the empty rules card. */
export function NoRules({ text }: { readonly text: string }) {
  const { palette } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(250)} layout={rowLayout}>
      <Text
        style={{ paddingVertical: 18, paddingHorizontal: 16, ...body(14), color: palette.inkSoft }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}
