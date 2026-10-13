import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { MAX_CREAM, MAX_INK } from '../purchases/max-colours';
import type { AskChat } from './use-ask';

/** The longest question the server reads (the request schema's limit). */
const MAX_QUESTION = 300;

/** The gap between the input and the top of the keyboard while it is up. */
const KEYBOARD_GAP = 8;

/**
 * Where the composer sits with the keyboard down (its bottom padding), how much of the keyboard's
 * height it does not have to rise by, and how far it is lifted right now: 0 down to minus that
 * rise, read from the keyboard's own position on the UI thread, frame by frame, also while the
 * keyboard is dragged down. The conversation above shrinks and lifts by the same amount.
 */
export function useComposerLift() {
  const { bottom } = useDesignInsets();
  const rest = bottom(30);
  const keyboardOffset = rest - KEYBOARD_GAP;
  // `height` runs from 0 down to minus the keyboard's height; the first part of it is the rest.
  const { height } = useReanimatedKeyboardAnimation();
  const lift = useDerivedValue(() => Math.min(0, height.get() + keyboardOffset));
  return { rest, keyboardOffset, lift };
}

/** "Unlimited with [lock MAX]": the free meter's way to Max. */
function UnlimitedWithMax({ onPress }: { readonly onPress: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}
    >
      <Text style={{ ...body(12.5, 650), color: palette.ink }}>{t('ask.unlimitedWith')}</Text>
      <View
        style={{
          height: 20,
          paddingLeft: 5,
          paddingRight: 7,
          borderRadius: 6,
          backgroundColor: palette.ink,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Symbol name="lock" size={12} fill={1} color={palette.sheetSolid} />
        <Text style={{ ...body(10, 800, 0.1), color: palette.sheetSolid }}>MAX</Text>
      </View>
    </PressScale>
  );
}

/** The dark bar that replaces the input once the week's free questions are used. */
function LockedBar({ total, onPress }: { readonly total: number; readonly onPress: () => void }) {
  const { t } = useI18n();
  return (
    <PressScale
      scaleTo={0.98}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 56,
        borderRadius: 28,
        backgroundColor: MAX_INK,
        paddingLeft: 20,
        paddingRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ ...body(14.5, 650), color: MAX_CREAM }}>
          {t('ask.locked.title', { total })}
        </Text>
        <Text style={{ ...body(12), color: MAX_CREAM, opacity: 0.65 }}>{t('ask.locked.sub')}</Text>
      </View>
      <View
        style={{
          height: 40,
          paddingHorizontal: 14,
          borderRadius: 20,
          backgroundColor: MAX_CREAM,
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(13.5, 700), color: MAX_INK }}>{t('ask.locked.cta')}</Text>
      </View>
    </PressScale>
  );
}

function Chips({
  suggestions,
  onPick,
}: {
  readonly suggestions: readonly string[];
  readonly onPick: (question: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ marginHorizontal: -12, flexGrow: 0 }}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}
    >
      {suggestions.map((label) => (
        <PressScale
          key={label}
          accessibilityRole="button"
          onPress={() => onPick(label)}
          style={{
            height: 34,
            paddingHorizontal: 13,
            borderRadius: 17,
            backgroundColor: palette.chipBg,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(13, 600), color: palette.ink }}>{label}</Text>
        </PressScale>
      ))}
    </ScrollView>
  );
}

function Input({
  onSend,
  disabled,
}: {
  readonly onSend: (question: string) => void;
  readonly disabled: boolean;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const ready = text.trim() !== '' && !disabled;
  const submit = () => {
    if (!ready) return;
    onSend(text);
    setText('');
  };
  const sendStyle = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0.4, { duration: 200 }),
  }));
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingLeft: 18,
        paddingRight: 6,
        borderRadius: 30,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={t('ask.placeholder')}
        placeholderTextColor={palette.inkSoft}
        returnKeyType="send"
        submitBehavior="submit"
        maxLength={MAX_QUESTION}
        autoCorrect={false}
        selectionColor={palette.accent}
        style={{ flex: 1, minWidth: 0, height: 40, padding: 0, fontSize: 16, color: palette.ink }}
      />
      <Animated.View style={sendStyle}>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={t('ask.send')}
          disabled={!ready}
          onPress={submit}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="arrow_upward" size={22} color="#2a1424" />
        </PressScale>
      </Animated.View>
    </View>
  );
}

/**
 * Everything under the conversation: the free-question meter or the lock, the suggestion chips
 * and the input. It rides on the keyboard, never lagging or leading it.
 */
export function AskComposer({ chat }: { readonly chat: AskChat }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { rest, lift: keyboardLift } = useComposerLift();
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: keyboardLift.get() }] }));
  const { freeLeft, locked } = chat;
  return (
    <Animated.View
      style={[{ paddingTop: 8, paddingHorizontal: 12, paddingBottom: rest, gap: 10 }, lift]}
    >
      {freeLeft !== null && freeLeft > 0 ? (
        <Animated.View
          entering={FadeIn}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            paddingHorizontal: 8,
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ ...body(12.5), flexShrink: 1, color: palette.inkSoft }}
          >
            {t('ask.meter', { left: freeLeft, total: chat.freeTotal })}
          </Text>
          <UnlimitedWithMax onPress={chat.openMax} />
        </Animated.View>
      ) : null}
      {locked ? (
        <Animated.View entering={FadeIn}>
          <LockedBar total={chat.freeTotal} onPress={chat.openMax} />
        </Animated.View>
      ) : null}
      <Chips suggestions={chat.suggestions} onPick={(question) => void chat.send(question)} />
      {locked ? null : (
        <Input disabled={chat.typing} onSend={(question) => void chat.send(question)} />
      )}
    </Animated.View>
  );
}
