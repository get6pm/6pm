import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { gestures, oklchSrgbHex } from '@6pm/theme';

import type { CategoryInput } from '../../data/category-actions';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { isSymbolName } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { Switch } from '../../ui/primitives/switch';
import { useTheme } from '../../ui/theme/theme';
import { body, families } from '../../ui/type/fonts';
import { HuePicker } from './hue-picker';
import { FREE_ICON_COUNT, MAX_ICON_COUNT } from './icon-packs';
import { IconPicker } from './icon-picker';

const OPEN_MS = 450;
const CLOSE_MS = 260;
const open = Easing.bezier(0.2, 0.9, 0.2, 1);
const settle = Easing.bezier(0.2, 0.9, 0.25, 1.12);
const leave = Easing.bezier(0.4, 0, 1, 1);
const FLICK = 900;
const DELETE_RED = oklchSrgbHex(0.66, 0.19, 25);

/**
 * The floating card that makes or edits a category, over the Categories sheet: name, icon, colour
 * and whether it counts toward the day. It rises over 0.45 s; Cancel, a tap outside or a drag down
 * on its grabber puts it away. `onClose` runs once it has left the screen.
 */
export function CategoryEditor({
  initial,
  title,
  deleteLabel,
  onSave,
  onDelete,
  onClose,
}: {
  readonly initial: CategoryInput;
  readonly title: string;
  /** "Delete · its spends move to Food"; null when this one cannot be deleted. */
  readonly deleteLabel: string | null;
  readonly onSave: (draft: CategoryInput) => void;
  readonly onDelete: () => void;
  readonly onClose: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { top } = useDesignInsets();
  const { height } = useWindowDimensions();
  const [draft, setDraft] = useState(initial);
  const area = height - top(58);
  const y = useSharedValue(area);
  const dim = useSharedValue(0);
  // Set once the card starts to leave, so a second tap cannot save or delete twice.
  const leaving = useRef(false);

  useEffect(() => {
    y.value = withTiming(0, { duration: OPEN_MS, easing: open });
    dim.value = withTiming(1, { duration: 300 });
  }, [y, dim]);

  const dismiss = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    y.value = withTiming(area, { duration: CLOSE_MS, easing: leave }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    dim.value = withTiming(0, { duration: CLOSE_MS });
  }, [area, dim, onClose, y]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      y.value = e.translationY < 0 ? e.translationY * 0.15 : e.translationY;
      dim.value = Math.max(0.15, 1 - y.value / 480);
    })
    .onEnd((e) => {
      if (y.value > gestures.sheetDismiss || e.velocityY > FLICK) {
        runOnJS(dismiss)();
      } else {
        y.value = withTiming(0, { duration: OPEN_MS, easing: settle });
        dim.value = withTiming(1, { duration: 300 });
      }
    });

  const card = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: dim.value }));
  const pickIcon = useCallback((icon: string) => setDraft((d) => ({ ...d, icon })), []);
  const pickHue = useCallback((hue: number) => setDraft((d) => ({ ...d, hue })), []);
  const named = draft.name.trim() !== '';
  const label = (text: string) => (
    <Text style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}>
      {text}
    </Text>
  );

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: top(58),
        bottom: 0,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ position: 'absolute', inset: 0 }, backdrop]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('categories.edit.cancel')}
          onPress={dismiss}
          style={{ flex: 1, backgroundColor: 'rgba(10,6,18,.4)' }}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            maxHeight: area - 70,
            borderRadius: 44,
            backgroundColor: palette.sheetSolid,
            borderWidth: 0.5,
            borderColor: palette.glassBorder,
            boxShadow: '0 30px 80px rgba(10,5,20,.45)',
            overflow: 'hidden',
          },
          card,
        ]}
      >
        <GestureDetector gesture={drag}>
          <View style={{ paddingTop: 8, paddingHorizontal: 18, gap: 18 }}>
            <View style={{ alignSelf: 'center', paddingVertical: 0, paddingHorizontal: 48 }}>
              <View
                style={{
                  width: 36,
                  height: 5,
                  borderRadius: 9,
                  backgroundColor: palette.inkSoft,
                  opacity: 0.35,
                }}
              />
            </View>
            <View style={{ minHeight: 34, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ ...body(17, 650), color: palette.ink }}>{title}</Text>
              <PressScale
                accessibilityRole="button"
                onPress={dismiss}
                hitSlop={8}
                style={{ position: 'absolute', left: 0, paddingVertical: 6 }}
              >
                <Text style={{ ...body(16), color: palette.inkSoft }}>
                  {t('categories.edit.cancel')}
                </Text>
              </PressScale>
              <PressScale
                accessibilityRole="button"
                accessibilityState={{ disabled: !named }}
                disabled={!named}
                onPress={() => {
                  if (leaving.current) return;
                  onSave(draft);
                  dismiss();
                }}
                hitSlop={8}
                style={{ position: 'absolute', right: 0, paddingVertical: 6 }}
              >
                <Text style={{ ...body(16, 700), color: palette.ink, opacity: named ? 1 : 0.35 }}>
                  {t('categories.edit.save')}
                </Text>
              </PressScale>
            </View>
          </View>
        </GestureDetector>
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          contentContainerStyle={{
            paddingTop: 18,
            paddingHorizontal: 18,
            paddingBottom: 20,
            gap: 18,
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', gap: 12 }}>
            <CategoryTile
              icon={isSymbolName(draft.icon) ? draft.icon : 'payments'}
              hue={draft.hue}
              size={68}
              radius={23}
              glyph={36}
            />
            <TextInput
              value={draft.name}
              onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
              placeholder={t('categories.edit.placeholder')}
              placeholderTextColor={palette.inkSoft}
              returnKeyType="done"
              maxLength={40}
              style={{
                alignSelf: 'stretch',
                textAlign: 'center',
                padding: 0,
                fontFamily: families.display,
                fontSize: 28,
                fontWeight: '500',
                letterSpacing: -0.28,
                color: palette.ink,
              }}
            />
          </View>
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingHorizontal: 2,
              }}
            >
              {label(t('categories.edit.icon'))}
              <Text style={{ ...body(12.5), color: palette.inkSoft }}>
                {t('categories.edit.iconCount', { free: FREE_ICON_COUNT, more: MAX_ICON_COUNT })}
              </Text>
            </View>
            <IconPicker icon={draft.icon} hue={draft.hue} onPick={pickIcon} />
          </View>
          <View style={{ gap: 10 }}>
            <View style={{ paddingHorizontal: 2 }}>{label(t('categories.edit.colour'))}</View>
            <HuePicker hue={draft.hue} label={t('categories.edit.colour')} onPick={pickHue} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingLeft: 16,
              paddingRight: 14,
              borderRadius: 20,
              backgroundColor: palette.cell,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ ...body(15.5, 600), color: palette.ink }}>
                {t('categories.edit.daily')}
              </Text>
              <Text style={{ ...body(12.5), lineHeight: 12.5 * 1.35, color: palette.inkSoft }}>
                {t('categories.edit.dailySub')}
              </Text>
            </View>
            <Switch
              value={draft.countsDaily}
              onChange={(countsDaily) => setDraft((d) => ({ ...d, countsDaily }))}
              accessibilityLabel={t('categories.edit.daily')}
            />
          </View>
          {deleteLabel ? (
            <PressScale
              accessibilityRole="button"
              onPress={() => {
                if (leaving.current) return;
                onDelete();
                dismiss();
              }}
              style={{
                height: 46,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(15, 600), color: DELETE_RED }}>{deleteLabel}</Text>
            </PressScale>
          ) : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
