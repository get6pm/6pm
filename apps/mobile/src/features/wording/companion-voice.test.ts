import { describe, expect, it } from '@jest/globals';

import type { Fact } from '@6pm/domain';

import { EMPTY_VOICE, factFor, parseVoice, withLine, withPick } from './companion-voice';

const fact = (key: string): Fact => ({
  kind: 'closeStreak',
  key,
  tone: 'good',
  salience: 0.5,
  repeatAfterDays: 1,
  slots: { days: { type: 'count', value: 3 } },
});

describe('the companion’s memory', () => {
  it('pins a moment to its fact for the day, so the line does not change under the user', () => {
    const voice = withPick(EMPTY_VOICE, 'today', fact('a'), '2026-10-09');
    const facts = [fact('a'), fact('b')];
    expect(factFor(voice, 'today', '2026-10-09', facts, () => fact('b'))?.key).toBe('a');
    // A new day picks again; so does a pinned fact that is no longer true.
    expect(factFor(voice, 'today', '2026-10-10', facts, () => fact('b'))?.key).toBe('b');
    expect(factFor(voice, 'today', '2026-10-09', [fact('b')], () => fact('b'))?.key).toBe('b');
  });

  it('remembers a fact once, however often the moment shows it', () => {
    const once = withPick(EMPTY_VOICE, 'today', fact('a'), '2026-10-09');
    expect(withPick(once, 'today', fact('a'), '2026-10-09')).toBe(once);
    expect(once.memory.map((m) => m.key)).toEqual(['a']);
  });

  it('keeps the newest worded lines only', () => {
    let voice = EMPTY_VOICE;
    for (let i = 0; i < 70; i += 1) {
      const day = `2026-10-${String(1 + (i % 28)).padStart(2, '0')}`;
      voice = withLine(voice, `k${String(i)}`, { text: 'Hi {days}', mood: 'happy' }, day);
    }
    expect(Object.keys(voice.lines)).toHaveLength(60);
  });

  it('starts empty when nothing is stored or it does not read', () => {
    expect(parseVoice(null)).toBe(EMPTY_VOICE);
    expect(parseVoice('{broken')).toBe(EMPTY_VOICE);
    expect(
      parseVoice(JSON.stringify(withPick(EMPTY_VOICE, 'close', fact('x'), '2026-10-09'))),
    ).toMatchObject({ picks: { close: { key: 'x' } } });
  });
});
