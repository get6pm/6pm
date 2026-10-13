import { useCallback, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gestures } from '@6pm/theme';

import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { release } from '../../ui/motion/physics';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { rowOffset, rowRelease } from './row-release';
import { SpendRowBackdrop } from './spend-row-backdrop';
import { SpendRowMenu } from './spend-row-menu';

/** Far enough left that a deleted row has left the screen before the list closes the gap. */
const GONE = -440;
const reduceMotion = ReduceMotion.System;

export interface SpendRowView {
  readonly id: string;
  readonly name: string;
  readonly meta: string;
  readonly amount: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly tag: string | null;
  /** Caught or pending: a right swipe confirms it. */
  readonly reviewable: boolean;
  readonly skipped: boolean;
  readonly first: boolean;
}

type RowAction = 'confirm' | 'delete' | 'open';

/**
 * A Today row. Swipe right past 90 pt to confirm a caught spend; swipe left to reveal Delete
 * (past −48 it stays open at −96, past −150 it deletes). The release reads where the flick was
 * heading, so a quick flick commits short of the line; the row then carries the finger's speed.
 * Haptic ticks mark each threshold. Held, it offers the same actions in a menu.
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
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';
  const { id, reviewable } = row;

  // Read through a ref so the list's fresh callbacks each render do not rebuild the gestures.
  const handlers = useRef({ onConfirm, onDelete, onOpen });
  handlers.current = { onConfirm, onDelete, onOpen };
  const act = useCallback((action: RowAction, target: string) => {
    const h = handlers.current;
    if (action === 'confirm') h.onConfirm(target);
    else if (action === 'delete') h.onDelete(target);
    else h.onOpen(target);
  }, []);

  const swipe = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        start.set(x.get());
      })
      .onUpdate((e) => {
        const next = rowOffset(start.get() + e.translationX, reviewable);
        const was = x.get();
        if (
          was > gestures.rowCommitDelete !== next > gestures.rowCommitDelete ||
          (reviewable && was > gestures.rowConfirm !== next > gestures.rowConfirm)
        ) {
          scheduleOnRN(haptics.tick);
        }
        x.set(next);
      })
      .onEnd((e) => {
        const velocity = e.velocityX;
        const decision = rowRelease(x.get(), velocity, reviewable);
        if (decision === 'delete') {
          scheduleOnRN(haptics.commit);
          x.set(
            withSpring(GONE, { ...release.away, velocity, reduceMotion }, (finished) => {
              if (finished) scheduleOnRN(act, 'delete', id);
            }),
          );
          return;
        }
        if (decision === 'confirm') {
          scheduleOnRN(haptics.tap);
          scheduleOnRN(act, 'confirm', id);
        }
        const target = decision === 'reveal' ? -gestures.rowDeleteWidth : 0;
        x.set(withSpring(target, { ...release.home, velocity, reduceMotion }));
      });
    const tap = Gesture.Tap().onEnd((_e, success) => {
      if (!success) return;
      if (x.get() !== 0) x.set(withSpring(0, { ...release.home, reduceMotion }));
      else scheduleOnRN(act, 'open', id);
    });
    return Gesture.Exclusive(pan, tap);
  }, [x, start, id, reviewable, act]);

  const front = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const deleteFromPanel = () => {
    haptics.commit();
    x.set(
      withSpring(GONE, { ...release.away, reduceMotion }, (finished) => {
        if (finished) scheduleOnRN(act, 'delete', id);
      }),
    );
  };

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
        onDeletePress={deleteFromPanel}
      />
      <SpendRowMenu
        href={`/spend/${id}`}
        reviewable={reviewable}
        confirmLabel={confirmLabel}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
        onConfirm={() => act('confirm', id)}
        onEdit={() => act('open', id)}
        onDelete={deleteFromPanel}
      >
        <GestureDetector gesture={swipe}>
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
