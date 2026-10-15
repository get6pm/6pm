import { describe, expect, it } from '@jest/globals';

import { t, type Language } from '@6pm/i18n';

import type { Voice } from '../wording/fact-words';
import { describeChat } from './ask-chat-words';
import type { LedgerWordsEnv } from './ask-ledger-words';

const lookUp = t as unknown as (
  language: Language,
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

function env(language: Language, voice: Voice): LedgerWordsEnv {
  const say = (key: string, params?: Readonly<Record<string, string | number>>) =>
    lookUp(language, key, params);
  return {
    t: say,
    language,
    monthLong: (m) => m,
    dayLongMonth: (d) => d.slice(5),
    weekday: (d) => d,
    categoryName: (id) => id,
    voice,
    slotWords: { language, say, categoryName: (id) => id, dayMonth: (d) => String(d.getDate()) },
  };
}

const streak = {
  kind: 'underStreak',
  key: 'underStreak',
  slots: { days: { type: 'count', value: 5 } },
};

describe('describeChat', () => {
  it('answers distress the same way in every voice, with the hotline and no joke', () => {
    const lines = (['soft', 'cheeky', 'roast', 'plain'] as const).map(
      (voice) =>
        describeChat({ kind: 'chat', topic: 'distress', fact: null }, env('vi', voice)).card.text,
    );
    expect(new Set(lines).size).toBe(1);
    expect(lines[0]).toContain('096 306 1414');
  });

  it('never comforts in the roast voice', () => {
    const roast = describeChat({ kind: 'chat', topic: 'venting', fact: null }, env('en', 'roast'));
    const soft = describeChat({ kind: 'chat', topic: 'venting', fact: null }, env('en', 'soft'));
    expect(roast.card.text).toBe(soft.card.text);
  });

  it('builds a hype on something going right', () => {
    const { card } = describeChat(
      { kind: 'chat', topic: 'hype', fact: streak as never },
      env('en', 'cheeky'),
    );
    expect(card.text.startsWith('Hype mode on:')).toBe(true);
    expect(card.text).toContain('5');
  });

  it('says so when there is nothing to roast', () => {
    expect(
      describeChat({ kind: 'chat', topic: 'roast', fact: null }, env('en', 'roast')).card.text,
    ).toBe('I wanted to roast you. You gave me nothing. Rude.');
  });
});
