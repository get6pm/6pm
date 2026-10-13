import { Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { Symbol } from '../../ui/icons/symbol';
import { CategoryTile } from '../../ui/category-tile';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import type { SpendRowView } from '../today/spend-row';

const layout = LinearTransition.springify().damping(22).stiffness(240);

/** One waiting spend: what, when, where it came from, and a round ✓ to keep it. */
export function InboxRow({
  row,
  keepLabel,
  onKeep,
}: {
  readonly row: SpendRowView;
  readonly keepLabel: string;
  readonly onKeep: (id: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      layout={layout}
      exiting={FadeOut.duration(180)}
      style={{ borderTopWidth: 0.5, borderTopColor: row.first ? 'transparent' : palette.hair }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 12,
        }}
      >
        <CategoryTile icon={row.icon} hue={row.hue} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text numberOfLines={1} style={{ ...body(16, 550), color: palette.ink }}>
            {row.name}
          </Text>
          <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
            {row.meta}
          </Text>
        </View>
        <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>{row.amount}</Text>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={`${keepLabel} ${row.name}`}
          hitSlop={2}
          onPress={() => onKeep(row.id)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.btnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="check" size={22} color={palette.btnFg} />
        </PressScale>
      </View>
    </Animated.View>
  );
}
