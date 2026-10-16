import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, type TextInputInstance, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewRef,
} from 'react-native-keyboard-controller';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { useFocusOnPresent } from '../../ui/navigation/use-focus-on-present';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { AnswerBubble, IntroBubble, MeBubble, TypingBubble } from './ask-bubbles';
import { AskComposer, useComposerLift } from './ask-composer';
import { AskSuggestionList } from './ask-suggestion-list';
import { useAsk } from './use-ask';

/** How long the screen settles before a question it was opened with is sent (the prototype's 350). */
const OPEN_WITH_DELAY_MS = 350;

/** How long the iPhone Duo's page takes to slide in before the caret goes into the composer. */
const PAGE_IN_MS = 320;

/**
 * Ask 6pm: a chat about what fits. `question` is sent as soon as the screen is up, for the entry
 * points that open it with a question already chosen. In its sheet it closes the sheet; on the
 * iPhone Duo's right page (`onClose`) it turns the page back, and says what the latest "can I
 * afford" question was for, so the left page can show it on today's meter (`onAfford`).
 */
export function AskScreen({
  question,
  onClose,
  onAfford,
}: {
  readonly question: string | null;
  readonly onClose?: () => void;
  readonly onAfford?: (amount: number | null) => void;
}) {
  const router = useRouter();
  const onPage = onClose !== undefined;
  const { palette, serious } = useTheme();
  const { t } = useI18n();
  const chat = useAsk();
  const scroll = useRef<KeyboardChatScrollViewRef>(null);
  const input = useRef<TextInputInstance>(null);
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

  // Opened to type: the keyboard comes up behind the sheet. Opened with a question, the answer
  // is what to read, so the keyboard stays down.
  useFocusOnPresent(input, question === null && !onPage);
  // On the page there is no sheet to wait for: the caret goes in once the page has slid in.
  useEffect(() => {
    if (!onPage || question !== null) return;
    const timer = setTimeout(() => input.current?.focus(), PAGE_IN_MS);
    return () => clearTimeout(timer);
  }, [onPage, question]);

  let affording: number | null = null;
  for (const message of chat.messages) {
    if (message.kind === 'answer' && message.query?.kind === 'afford')
      affording = message.query.amount;
  }
  useEffect(() => {
    onAfford?.(affording);
  }, [onAfford, affording]);
  useEffect(() => () => onAfford?.(null), [onAfford]);

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
      <View
        style={{ paddingTop: onPage ? 16 : 8, paddingHorizontal: 16, paddingBottom: 10, gap: 6 }}
      >
        {onPage ? null : (
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
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {serious ? null : <Companion size={44} mood={chat.mood} />}
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ ...body(17, 700), color: palette.ink }}>{t('ask.title')}</Text>
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('ask.sub')}</Text>
          </View>
          <PressScale
            accessibilityRole="button"
            onPress={() => (onClose ? onClose() : router.back())}
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
                <AnswerBubble
                  key={message.id}
                  card={message.card}
                  onAction={(choice) => void chat.act(message.id, choice)}
                />
              ),
            )}
            {chat.typing ? <TypingBubble /> : null}
          </KeyboardChatScrollView>
        </Animated.View>
      </Animated.View>
      <AskComposer chat={chat} inputRef={input} />
    </View>
  );
}
