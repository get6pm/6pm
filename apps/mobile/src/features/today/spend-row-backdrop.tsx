import { Pressable, Text, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { gestures, oklchSrgbHex } from '@6pm/theme';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const DELETE_RED = oklchSrgbHex(0.6, 0.17, 25);

/**
 * What a swipe uncovers under a Today row: Confirm on the left, Delete on the right. The colour
 * grows from half the row to all of it past the commit point. It is a transform, not a width, so
 * the swipe never makes layout run.
 */
export function SpendRowBackdrop({
  x,
  confirmLabel,
  deleteLabel,
  deleteIcon = 'delete',
  onDeletePress,
}: {
  readonly x: SharedValue<number>;
  readonly confirmLabel: string;
  readonly deleteLabel: string;
  /** The glyph over the removing side: the bin on Today, a cross where the row is skipped. */
  readonly deleteIcon?: SymbolName;
  readonly onDeletePress: () => void;
}) {
  const { palette } = useTheme();
  const confirmFill = useAnimatedStyle(() => ({
    opacity: x.get() > 0 ? Math.min(1, x.get() / 50) : 0,
    transform: [{ scaleX: x.get() > gestures.rowConfirm ? 1 : 0.5 }],
  }));
  const deleteFill = useAnimatedStyle(() => ({
    opacity: x.get() < 0 ? Math.min(1, -x.get() / 50) : 0,
    transform: [{ scaleX: x.get() < gestures.rowCommitDelete ? 1 : 0.5 }],
  }));
  const confirmLabelStyle = useAnimatedStyle(() => ({
    opacity: x.get() > 0 ? Math.min(1, x.get() / 50) : 0,
  }));
  const deleteLabelStyle = useAnimatedStyle(() => ({
    opacity: x.get() < 0 ? Math.min(1, -x.get() / 50) : 0,
  }));

  return (
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
        onPress={onDeletePress}
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
          <Symbol name={deleteIcon} size={22} color="#fff" />
          <Text style={{ ...body(11.5, 700), color: '#fff' }}>{deleteLabel}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}
