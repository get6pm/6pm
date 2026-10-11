import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { gestures, oklchSrgbHex } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { CategoryTile } from '../../ui/category-tile';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';

const settle = Easing.bezier(0.2, 0.9, 0.25, 1.05);
const DELETE_RED = oklchSrgbHex(0.6, 0.17, 25);

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

/**
 * A Today row. Swipe right past 90 pt to confirm a caught spend; swipe left to reveal Delete
 * (past −48 it stays open at −96, past −150 it deletes). Haptic ticks mark each threshold.
 */
export function SpendRow({
  row,
  confirmLabel,
  deleteLabel,
  onConfirm,
  onDelete,
  onOpen,
}: {
  readonly row: SpendRowView;
  readonly confirmLabel: string;
  readonly deleteLabel: string;
  readonly onConfirm: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onOpen: (id: string) => void;
}) {
  const { palette } = useTheme();
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const warn = palette.dark ? '#ffbe8a' : '#b8622a';

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      let next = start.value + e.translationX;
      if (next > 0) next = row.reviewable ? Math.min(next, 220) : next * 0.12;
      next = Math.max(next, -320);
      const was = x.value;
      if (
        was > gestures.rowCommitDelete !== next > gestures.rowCommitDelete ||
        (row.reviewable && was > gestures.rowConfirm !== next > gestures.rowConfirm)
      ) {
        runOnJS(haptics.tick)();
      }
      x.value = next;
    })
    .onEnd(() => {
      const at = x.value;
      if (at < gestures.rowCommitDelete) {
        x.value = withTiming(-420, { duration: 200, easing: settle }, () =>
          runOnJS(onDelete)(row.id),
        );
      } else if (at > gestures.rowConfirm && row.reviewable) {
        x.value = withTiming(0, { duration: 400, easing: settle });
        runOnJS(haptics.tap)();
        runOnJS(onConfirm)(row.id);
      } else if (at < gestures.rowRevealDelete) {
        x.value = withTiming(-gestures.rowDeleteWidth, { duration: 400, easing: settle });
      } else {
        x.value = withTiming(0, { duration: 400, easing: settle });
      }
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (x.value !== 0) x.value = withTiming(0, { duration: 350, easing: settle });
    else runOnJS(onOpen)(row.id);
  });

  const front = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  // The colour grows from half the row to all of it past the commit point. It is a transform, not
  // a width, so the swipe never makes layout run.
  const confirmFill = useAnimatedStyle(() => ({
    opacity: x.value > 0 ? Math.min(1, x.value / 50) : 0,
    transform: [{ scaleX: x.value > gestures.rowConfirm ? 1 : 0.5 }],
  }));
  const deleteFill = useAnimatedStyle(() => ({
    opacity: x.value < 0 ? Math.min(1, -x.value / 50) : 0,
    transform: [{ scaleX: x.value < gestures.rowCommitDelete ? 1 : 0.5 }],
  }));
  const confirmLabelStyle = useAnimatedStyle(() => ({
    opacity: x.value > 0 ? Math.min(1, x.value / 50) : 0,
  }));
  const deleteLabelStyle = useAnimatedStyle(() => ({
    opacity: x.value < 0 ? Math.min(1, -x.value / 50) : 0,
  }));
  const deleteFromPanel = () => {
    haptics.tap();
    x.value = withTiming(-420, { duration: 200, easing: settle }, (finished) => {
      'worklet';
      if (finished) runOnJS(onDelete)(row.id);
    });
  };

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              inset: 0,
              backgroundColor: palette.accent,
              transformOrigin: 'left',
            },
            confirmFill,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 3,
              paddingLeft: 22,
            },
            confirmLabelStyle,
          ]}
        >
          <Symbol name="check_circle" size={22} fill={1} color="#2a1424" />
          <Text style={{ ...body(11.5, 700), color: '#2a1424' }}>{confirmLabel}</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              inset: 0,
              backgroundColor: DELETE_RED,
              transformOrigin: 'right',
            },
            deleteFill,
          ]}
        />
        {/* Under the row until a swipe opens it; VoiceOver deletes through the row's own action. */}
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={deleteFromPanel}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: gestures.rowDeleteWidth,
          }}
        >
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 3,
                paddingRight: 24,
              },
              deleteLabelStyle,
            ]}
          >
            <Symbol name="delete" size={22} color="#fff" />
            <Text style={{ ...body(11.5, 700), color: '#fff' }}>{deleteLabel}</Text>
          </Animated.View>
        </Pressable>
      </View>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View
          accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') onDelete(row.id);
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
    </View>
  );
}
