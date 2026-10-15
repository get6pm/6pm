import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import { useMoneyStore, type useMoneyActions } from '../../data/money-provider';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { haptics } from '../../ui/haptics';
import type { AskWordsNow } from './ask-card';
import { writeTurn } from './ask-turns-store';
import type { AskCard } from './ask-words';
import type { AskMessage } from './use-ask';

export const plainCard = (text: string, mood: CompanionMood): AskCard => ({
  text,
  mood,
  bars: null,
  rows: [],
  note: null,
});

/**
 * An answer's buttons. `go` adds the spend, or opens what the answer offers (New pot filled in,
 * a capture guide, Quick add, Max); `cancel` changes nothing. Either way the card says what
 * happened and keeps no buttons.
 */
export function useAskAct(deps: {
  readonly messages: readonly AskMessage[];
  readonly setMessages: Dispatch<SetStateAction<readonly AskMessage[]>>;
  readonly words: MutableRefObject<AskWordsNow>;
  readonly actions: ReturnType<typeof useMoneyActions>;
}) {
  const { messages, setMessages, words, actions } = deps;
  const router = useRouter();
  const store = useMoneyStore();

  /** Replaces an answered card, here and on the phone. */
  const settle = useCallback(
    (id: string, card: AskCard) => {
      setMessages((all) =>
        all.map((m) => (m.id === id && m.kind === 'answer' ? { ...m, card, pending: null } : m)),
      );
      const message = messages.find((m) => m.id === id);
      const query = message?.kind === 'answer' ? message.query : null;
      writeTurn(store.db, { key: id, kind: 'answer', card, query }).catch((error: unknown) =>
        Sentry.captureException(error),
      );
    },
    [messages, setMessages, store],
  );

  const act = useCallback(
    async (id: string, choice: 'go' | 'cancel') => {
      const message = messages.find((m) => m.id === id);
      if (message?.kind !== 'answer' || message.pending === null) return;
      const { pending } = message;
      const say = words.current.t;
      if (choice === 'cancel') {
        settle(id, plainCard(say('ask.action.cancelled'), 'calm'));
        return;
      }
      if (pending.kind === 'open') {
        settle(id, { ...message.card, actions: [] });
        router.push(
          pending.params === undefined
            ? pending.pathname
            : { pathname: pending.pathname, params: pending.params },
        );
        return;
      }
      try {
        await actions.addSpend({
          amount: pending.amount,
          categoryId: pending.categoryId,
          merchant: pending.name,
          source: 'manual',
          status: 'kept',
        });
        haptics.success();
        const amount = words.current.money.full(pending.amount);
        settle(id, plainCard(say('ask.action.added', { name: pending.name, amount }), 'happy'));
      } catch (error) {
        Sentry.captureException(error);
        settle(id, plainCard(say('ask.action.failed'), 'think'));
      }
    },
    [actions, messages, router, settle, words],
  );

  return act;
}
