import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { groupDigits, type CategoryRow } from '@6pm/domain';

import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { easeOut } from '../../ui/motion/curves';
import { useDragDismiss } from '../../ui/motion/use-drag-dismiss';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';

const STEP = 5_000;

/**
 * Edit one caught spend without leaving the close: nudge the amount by 5k, pick the category,
 * then "Save and keep".
 */
export function CloseEdit({
  name,
  amount,
  categoryId,
  categories,
  saveLabel,
  onSave,
  onCancel,
}: {
  readonly name: string;
  readonly amount: number;
  readonly categoryId: string;
  readonly categories: readonly CategoryRow[];
  readonly saveLabel: string;
  readonly onSave: (amount: number, categoryId: string) => void;
  readonly onCancel: () => void;
}) {
  const { palette } = useTheme();
  const { bottom } = useDesignInsets();
  const { height } = useWindowDimensions();
  const sheet = useDragDismiss({ area: height, onDismissed: onCancel, enter: false });
  const [value, setValue] = useState(amount);
  const [category, setCategory] = useState(categoryId);
  const step = (by: number) => {
    haptics.tick();
    setValue((v) => Math.max(0, v + by));
  };
  const stepper = (icon: 'remove' | 'add', by: number) => (
    <PressScale
      onPress={() => step(by)}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: palette.chipBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={24} color={palette.ink} />
    </PressScale>
  );

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
                paddingHorizontal: 20,
                paddingBottom: bottom(30),
                gap: 20,
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
              {name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {stepper('remove', -STEP)}
              <Text style={{ ...display(44, 500, -0.02), ...tabular, color: palette.ink }}>
                {groupDigits(value)}₫
              </Text>
              {stepper('add', STEP)}
            </View>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}
            >
              {categories.map((c) => {
                const on = c.id === category;
                return (
                  <PressScale
                    key={c.id}
                    onPress={() => {
                      haptics.tick();
                      setCategory(c.id);
                    }}
                    style={{
                      height: 36,
                      paddingHorizontal: 12,
                      borderRadius: 99,
                      backgroundColor: on ? palette.btnBg : palette.chipBg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSymbolName(c.icon) ? (
                      <Symbol
                        name={c.icon}
                        size={18}
                        fill={1}
                        color={on ? palette.btnFg : palette.ink}
                      />
                    ) : null}
                    <Text style={{ ...body(14, 600), color: on ? palette.btnFg : palette.ink }}>
                      {c.name}
                    </Text>
                  </PressScale>
                );
              })}
            </View>
            <PressScale
              scaleTo={0.97}
              onPress={() => onSave(value, category)}
              style={{
                height: 56,
                borderRadius: 99,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: '#2a1424' }}>{saveLabel}</Text>
            </PressScale>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}
