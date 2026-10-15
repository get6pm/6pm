import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from 'react-native-keyboard-controller';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { AnswerBubble, IntroBubble, MeBubble, TypingBubble } from './ask-bubbles';
import { AskComposer, useComposerLift } from './ask-composer';
import { AskSuggestionList } from './ask-suggestion-list';
import { useAsk } from './use-ask';

/** How long the screen settles before a question it was opened with is sent (the prototype's 350). */
const OPEN_WITH_DELAY_MS = 350;

/**
 * Ask 6pm: a chat about what fits. `question` is sent as soon as the screen is up, for the entry
 * points that open it with a question already chosen.
 */
export function AskScreen({ question }: { readonly question: string | null }) {
  const router = useRouter();
  const { palette, serious } = useTheme();
  const { t } = useI18n();
  const chat = useAsk();
  const scroll = useRef<KeyboardChatScrollViewRef>(null);
  const { keyboardOffset, lift } = useComposerLift();
  // The conversation's window ends at the composer's top without a layout pass: the clip moves up
  // with the composer and its contents move back down by as much, so only the bottom edge rises.
  const clip = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));
  const unclip = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() }] }));

  // A light tap as the sheet starts to rise, once per opening (the ways in leave it to the sheet).
  const tapped = useRef(false);
  useEffect(() => {
    if (tapped.current) return;
    tapped.current = true;
    haptics.tap();
  }, []);

  // Sent once, a moment after the screen opens; closing the screen first cancels it.
  const send = useRef(chat.send);
  send.current = chat.send;
  useEffect(() => {
    if (question === null) return;
    const timer = setTimeout(() => void send.current(question), OPEN_WITH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [question]);

  return (
    <View style={{ flex: 1, experimental_backgroundImage: palette.skyDeep }}>
      {/* A native sheet like the others: the grabber on top, Done on the right, and a drag down
          anywhere or from the top of the conversation puts it away. */}
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 10, gap: 6 }}>
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 9,
            backgroundColor: palette.inkSoft,
            opacity: 0.35,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {serious ? null : <Companion size={44} mood={chat.mood} />}
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ ...body(17, 700), color: palette.ink }}>{t('ask.title')}</Text>
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('ask.sub')}</Text>
          </View>
          <PressScale
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={8}
            style={{ paddingVertical: 8, paddingHorizontal: 2 }}
          >
            <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
          </PressScale>
        </View>
      </View>
      <Animated.View pointerEvents="box-none" style={[{ flex: 1, overflow: 'hidden' }, clip]}>
        <Animated.View pointerEvents="box-none" style={[{ flex: 1 }, unclip]}>
          {/* The conversation rises with the keyboard, frame by frame and by as much as the composer
              does, so the newest bubble stays just above it while the keyboard moves. */}
          <KeyboardChatScrollView
            ref={scroll}
            offset={keyboardOffset}
            style={{ flex: 1 }}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 10,
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          >
            <IntroBubble text={t('ask.intro')} />
            {chat.messages.length === 0 ? (
              <AskSuggestionList suggestions={chat.suggestions} onPick={(q) => void chat.send(q)} />
            ) : null}
            {chat.messages.map((message) =>
              message.kind === 'me' ? (
                <MeBubble key={message.id} text={message.text} />
              ) : (
                <AnswerBubble key={message.id} card={message.card} />
              ),
            )}
            {chat.typing ? <TypingBubble /> : null}
          </KeyboardChatScrollView>
        </Animated.View>
      </Animated.View>
      <AskComposer chat={chat} />
    </View>
  );
}
