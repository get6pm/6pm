import { Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { Symbol } from '../../ui/icons/symbol';
import { CategoryTile } from '../../ui/category-tile';
import { PressScale } from '../../ui/primitives/press-scale';
import { useI18n } from '../../i18n/i18n';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import type { SpendRowView } from '../today/spend-row';

const layout = LinearTransition.springify().damping(22).stiffness(240);

/** One waiting spend: what, when, where it came from, and a round ✓ to keep it. */
export function InboxRow({
  row,
  keepLabel,
  amountMissing,
  onKeep,
}: {
  readonly row: SpendRowView;
  readonly keepLabel: string;
  /** Nothing was read for it: "No amount" stands where 0₫ would. */
  readonly amountMissing: boolean;
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
        <InboxAmount row={row} amountMissing={amountMissing} />
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

/** The amount as printed, with its đồng under it when it was spent in another currency. */
function InboxAmount({
  row,
  amountMissing,
}: {
  readonly row: SpendRowView;
  readonly amountMissing: boolean;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  if (row.foreign) {
    return (
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>
          {row.foreign.printed}
        </Text>
        <Text style={{ ...body(13), ...tabular, color: palette.inkSoft }}>
          {row.foreign.inDong === null
            ? t('inbox.ratePending')
            : t('inbox.inDong', { amount: row.foreign.inDong })}
        </Text>
      </View>
    );
  }
  if (amountMissing) {
    return <Text style={{ ...body(15, 550), color: palette.inkSoft }}>{t('inbox.noAmount')}</Text>;
  }
  return <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>{row.amount}</Text>;
}
