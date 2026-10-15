import { describe, expect, it } from 'vitest';

import type { Fact } from './fact';
import { day, spend } from './insight-fixture';
import { hardDay, lineVoice, touchesNeverRoast } from './voice';

const merchant = (name: string, about?: string[]): Fact => ({
  kind: 'repeatMerchant',
  key: `repeatMerchant:${name}`,
  tone: 'neutral',
  salience: 0.5,
  repeatAfterDays: 3,
  slots: {
    merchant: { type: 'merchant', value: name },
    visits: { type: 'count', value: 3 },
    amount: { type: 'money', value: 360_000 },
  },
  ...(about === undefined ? {} : { about }),
});

const pace = (category: string): Fact => ({
  kind: 'categoryPace',
  key: `categoryPace:${category}:more`,
  tone: 'watch',
  salience: 0.5,
  repeatAfterDays: 7,
  slots: {
    category: { type: 'category', id: category },
    now: { type: 'money', value: 600_000 },
    before: { type: 'money', value: 400_000 },
    compare: { type: 'compare', value: 'more' },
  },
});

describe('touchesNeverRoast', () => {
  it('finds health, the home, family and gifts by slot, by `about`, or by the spends there', () => {
    expect(touchesNeverRoast(pace('health'))).toBe(true);
    expect(touchesNeverRoast(pace('drinks'))).toBe(false);
    expect(touchesNeverRoast(merchant('Pharmacity', ['health']))).toBe(true);
    expect(
      touchesNeverRoast(merchant('Lotte'), [spend('2026-10-08', ' lotte', 300_000, 'gifts')]),
    ).toBe(true);
    expect(touchesNeverRoast(merchant('Highlands', ['drinks']))).toBe(false);
  });
});

describe('hardDay', () => {
  it('is a day with the cycle’s money gone, or well over its line', () => {
    expect(hardDay(day())).toBe(false);
    expect(hardDay(day({ free: -50_000 }))).toBe(true);
    // Half the line over, or more.
    expect(hardDay(day({ safe: -180_000, tomorrow: 343_000, replan: true }))).toBe(true);
    expect(hardDay(day({ safe: -100_000, tomorrow: 346_000, replan: true }))).toBe(false);
    // Tomorrow's line cut by a fifth.
    expect(hardDay(day({ safe: -100_000, tomorrow: 270_000, replan: true }))).toBe(true);
  });
});

describe('lineVoice', () => {
  const easy = day({ spent: 100_000, safe: 251_000 });

  it('keeps the chosen voice on an easy day about an everyday spend', () => {
    expect(lineVoice('roast', merchant('Highlands', ['drinks']), easy)).toBe('roast');
    expect(lineVoice('cheeky', pace('drinks'), easy)).toBe('cheeky');
  });

  it('turns a roast or a tease soft about what is never teased', () => {
    expect(lineVoice('roast', pace('home'), easy)).toBe('soft');
    expect(lineVoice('cheeky', merchant('Pharmacity', ['health']), easy)).toBe('soft');
  });

  it('turns a roast or a tease soft on a hard day', () => {
    expect(lineVoice('roast', pace('drinks'), day({ free: -1_000 }))).toBe('soft');
    expect(lineVoice('cheeky', merchant('Highlands'), day({ safe: -400_000 }))).toBe('soft');
  });

  it('leaves soft and plain as they are', () => {
    expect(lineVoice('plain', pace('health'), day({ free: -1_000 }))).toBe('plain');
    expect(lineVoice('soft', pace('drinks'), easy)).toBe('soft');
  });
});
