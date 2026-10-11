import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Keyboard, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { GlassButton } from '../../ui/primitives/glass-button';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { AnswerBubble, IntroBubble, MeBubble, TypingBubble } from './ask-bubbles';
import { AskComposer } from './ask-composer';
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
  const { top } = useDesignInsets();
  const chat = useAsk();
  const scroll = useRef<ScrollViewInstance>(null);
  // Once the keyboard is up, the newest bubble moves into view; not on every frame of its rise.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () =>
      scroll.current?.scrollToEnd({ animated: true }),
    );
    return () => sub.remove();
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: top(58),
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <GlassButton icon="arrow_back" label={t('ask.back')} onPress={() => router.back()} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {serious ? null : <Companion size={44} mood={chat.mood} />}
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ ...body(17, 700), color: palette.ink }}>{t('ask.title')}</Text>
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('ask.sub')}</Text>
          </View>
        </View>
      </View>
      <ScrollView
        ref={scroll}
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
      </ScrollView>
      <AskComposer chat={chat} />
    </View>
  );
}
