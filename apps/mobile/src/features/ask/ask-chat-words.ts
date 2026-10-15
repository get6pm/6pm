import { SERIOUS_TOPICS, type ChatAnswer } from '@6pm/domain';

import { catalogueLine } from '../wording/fact-words';
import type { AskCard } from './ask-words';
import type { LedgerCard, LedgerWordsEnv } from './ask-ledger-words';

/** Catalogue keys built at run time. */
type Say = (key: string) => string;

const MOODS: Readonly<Record<string, AskCard['mood']>> = {
  greeting: 'wave',
  thanks: 'happy',
  identity: 'calm',
  privacy: 'calm',
  offTopic: 'think',
  venting: 'calm',
  roast: 'nod',
  hype: 'happy',
  distress: 'calm',
  investing: 'think',
  unsafe: 'think',
};

function card(text: string, mood: AskCard['mood']): LedgerCard {
  return { card: { text, mood, bars: null, rows: [], note: null }, wording: null };
}

/**
 * Small talk in the companion's voice. A roast teases one true spend and a hype names one thing
 * going right; comfort never comes in the roast voice. Distress, investing and unsafe questions
 * get the same serious line in every voice, with no fact and no joke.
 */
export function describeChat(answer: ChatAnswer, env: LedgerWordsEnv): LedgerCard {
  const say = env.t as unknown as Say;
  const { topic, fact } = answer;
  if (topic === null) return card(say('ask.answer.chat'), 'wave');
  const mood = MOODS[topic] ?? 'calm';
  if (SERIOUS_TOPICS.has(topic) || topic === 'identity' || topic === 'privacy') {
    return card(say(`ask.chat.${topic}`), mood);
  }
  const voice = env.voice;
  if (topic === 'roast' || topic === 'hype') {
    if (fact === null) return card(say(`ask.chat.${topic}Nothing.${voice}`), mood);
    const line = catalogueLine(fact, voice, 0, env.slotWords);
    return card(`${say(`ask.chat.${topic}.${voice}`)} ${line}`, mood);
  }
  if (topic === 'venting') {
    // Comfort is never roasted.
    const kind = voice === 'roast' ? 'soft' : voice;
    const rest =
      fact === null
        ? say('ask.chat.freshStart')
        : `${say('ask.chat.goingRight')} ${catalogueLine(fact, kind, 0, env.slotWords)}`;
    return card(`${say(`ask.chat.venting.${kind}`)} ${rest}`, mood);
  }
  return card(say(`ask.chat.${topic}.${voice}`), mood);
}
