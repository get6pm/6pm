import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import {
  emptyKeypad,
  groupDigits,
  keypadVnd,
  pressKey,
  type CategoryRow,
  type KeypadKey,
} from '@6pm/domain';

import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { Keypad } from '../../ui/keypad';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { easeOut } from '../../ui/motion/curves';
import { useDragDismiss } from '../../ui/motion/use-drag-dismiss';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';

/**
 * A cash amount that is none of the quick chips: type it on the money keypad, pick what it was
 * for, and add it to today's cash.
 */
export function CashCustom({
  title,
  addLabel,
  categories,
  initialCategoryId,
  onAdd,
  onCancel,
}: {
  readonly title: string;
  readonly addLabel: string;
  readonly categories: readonly CategoryRow[];
  readonly initialCategoryId: string;
  readonly onAdd: (amount: number, categoryId: string) => void;
  readonly onCancel: () => void;
}) {
  const { palette } = useTheme();
  const { bottom } = useDesignInsets();
  const { height } = useWindowDimensions();
  const sheet = useDragDismiss({ area: height, onDismissed: onCancel, enter: false });
  const [keys, setKeys] = useState(emptyKeypad);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const amount = keypadVnd(keys, 0);

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Animated.View style={[{ flex: 1 }, sheet.backdrop]}>
          <Pressable onPress={onCancel} style={{ flex: 1, backgroundColor: 'rgba(10,6,18,.45)' }} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(24).stiffness(240)}
        exiting={SlideOutDown.duration(220).easing(easeOut)}
        onLayout={sheet.onLayout}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <GestureDetector gesture={sheet.drag}>
          <Animated.View
            style={[
              {
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                backgroundColor: palette.sheetSolid,
                paddingTop: 22,
                paddingHorizontal: 16,
                paddingBottom: bottom(24),
                gap: 14,
              },
              sheet.panel,
            ]}
          >
            {/* The sheet colour carries on below, so a pull upward never shows a gap. */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '100%',
                height: 240,
                backgroundColor: palette.sheetSolid,
              }}
            />
            <Text style={{ ...body(17, 650), color: palette.ink, textAlign: 'center' }}>
              {title}
            </Text>
            <Text
              style={{
                ...display(48, 500, -0.02),
                ...tabular,
                lineHeight: 52,
                textAlign: 'center',
                color: palette.ink,
                opacity: amount > 0 ? 1 : 0.35,
              }}
            >
              {groupDigits(amount)}₫
            </Text>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}
            >
              {categories.map((c) => {
                const on = c.id === categoryId;
                return (
                  <PressScale
                    key={c.id}
                    onPress={() => {
                      haptics.tick();
                      setCategoryId(c.id);
                    }}
                    style={{
                      height: 32,
                      paddingHorizontal: 11,
                      borderRadius: 99,
                      backgroundColor: on ? palette.btnBg : palette.chipBg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {isSymbolName(c.icon) ? (
                      <Symbol
                        name={c.icon}
                        size={16}
                        fill={1}
                        color={on ? palette.btnFg : palette.ink}
                      />
                    ) : null}
                    <Text style={{ ...body(13, 600), color: on ? palette.btnFg : palette.ink }}>
                      {c.name}
                    </Text>
                  </PressScale>
                );
              })}
            </View>
            <Keypad onPress={(key: KeypadKey) => setKeys((k) => pressKey(k, key))} />
            <PressScale
              scaleTo={0.97}
              disabled={amount <= 0}
              onPress={() => onAdd(amount, categoryId)}
              style={{
                height: 56,
                borderRadius: 99,
                backgroundColor: palette.accent,
                opacity: amount > 0 ? 1 : 0.4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: '#2a1424' }}>{addLabel}</Text>
            </PressScale>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}
