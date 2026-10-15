import { Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { CategoryTile } from '../../ui/category-tile';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { useRowSwipe } from './row-swipe';
import { SpendRowBackdrop } from './spend-row-backdrop';
import { SpendRowMenu } from './spend-row-menu';

export interface SpendRowView {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly amount: string;
  /**
   * Spent in another currency: the amount as printed ("Rp496.650") and its đồng ("780.000₫"),
   * or null đồng while there is no rate to price it.
   */
  readonly foreign: { readonly printed: string; readonly inDong: string | null } | null;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly tag: string | null;
  /** Caught or pending: a right swipe confirms it. */
  readonly reviewable: boolean;
  readonly skipped: boolean;
  readonly first: boolean;
}

/**
 * A Today row. Swipe right past 90 pt to confirm a caught spend; swipe left to reveal Delete
 * (`useRowSwipe` has the thresholds). Held, it offers the same actions in a menu.
 */
export function SpendRow({
  row,
  confirmLabel,
  deleteLabel,
  editLabel,
  onConfirm,
  onDelete,
  onOpen,
}: {
  readonly row: SpendRowView;
  readonly confirmLabel: string;
  readonly deleteLabel: string;
  readonly editLabel: string;
  readonly onConfirm: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onOpen: (id: string) => void;
}) {
  const { palette } = useTheme();
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';
  const { id, reviewable } = row;
  const { x, gesture, front, deleteAway, act } = useRowSwipe(id, reviewable, {
    onConfirm,
    onDelete,
    onOpen,
  });

  const accessibilityActions = [
    { name: 'activate' },
    ...(reviewable ? [{ name: 'confirm', label: confirmLabel }] : []),
    { name: 'delete', label: deleteLabel },
  ];

  return (
    <View style={{ overflow: 'hidden' }}>
      <SpendRowBackdrop
        x={x}
        confirmLabel={confirmLabel}
        deleteLabel={deleteLabel}
        onDeletePress={deleteAway}
      />
      <SpendRowMenu
        href={`/spend/${id}`}
        reviewable={reviewable}
        confirmLabel={confirmLabel}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
        onConfirm={() => act('confirm', id)}
        onEdit={() => act('open', id)}
        onDelete={deleteAway}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            accessible
            accessibilityRole="button"
            accessibilityLabel={[row.name, row.amount, row.meta, row.tag]
              .filter(Boolean)
              .join(', ')}
            accessibilityActions={accessibilityActions}
            onAccessibilityAction={(event) => {
              const name = event.nativeEvent.actionName;
              if (name === 'activate') act('open', id);
              else if (name === 'confirm') act('confirm', id);
              else if (name === 'delete') act('delete', id);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                backgroundColor: palette.cell,
                opacity: row.skipped ? 0.45 : 1,
              },
              front,
            ]}
          >
            <CategoryTile icon={row.icon} hue={row.hue} />
            <View
              style={{
                flex: 1,
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                borderTopWidth: 0.5,
                borderTopColor: row.first ? 'transparent' : palette.hair,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    ...body(16, 550),
                    color: palette.ink,
                    textDecorationLine: row.skipped ? 'line-through' : 'none',
                  }}
                >
                  {row.name}
                </Text>
                <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
                  {row.meta}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text
                  style={{
                    ...body(16, 600),
                    ...tabular,
                    color: palette.ink,
                    textDecorationLine: row.skipped ? 'line-through' : 'none',
                  }}
                >
                  {row.amount}
                </Text>
                {row.tag ? (
                  <Text
                    style={{
                      ...body(11, 600, 0.04),
                      textTransform: 'uppercase',
                      color: row.reviewable ? warn : palette.inkSoft,
                    }}
                  >
                    {row.tag}
                  </Text>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </SpendRowMenu>
    </View>
  );
}
