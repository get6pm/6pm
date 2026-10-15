import { describe, expect, it } from 'vitest';

import { fillLine, placeholdersOf, validateLine } from './validate-line';

const en = {
  facts: [['merchant', 'visits', 'amount']],
  language: 'en',
  surface: 'bubble',
} as const;
const vi = { ...en, language: 'vi' } as const;

describe('validateLine', () => {
  it('passes a line that only uses its placeholders', () => {
    expect(validateLine('{merchant} again? That’s {visits} since Monday ☕', en)).toEqual({
      ok: true,
    });
    expect(validateLine('Lại {merchant} nữa hả? Tuần này {visits} lần rồi nè', vi)).toEqual({
      ok: true,
    });
  });

  it('rejects a number the model wrote itself, in any script', () => {
    expect(validateLine('That’s 4 visits since Monday', en)).toEqual({
      ok: false,
      problem: 'digit',
    });
    expect(validateLine('That’s ٤ visits', en)).toEqual({ ok: false, problem: 'digit' });
  });

  it('rejects placeholders it was not given, and broken ones', () => {
    expect(validateLine('You have {safe} left', en)).toEqual({
      ok: false,
      problem: 'unknownPlaceholder',
    });
    expect(validateLine('You spent {amount at {merchant}', en)).toEqual({
      ok: false,
      problem: 'brokenPlaceholder',
    });
  });

  it('rejects a line in the other language, but not an English loanword', () => {
    expect(validateLine('Tuần này {visits} lần rồi nè', en)).toEqual({
      ok: false,
      problem: 'wrongLanguage',
    });
    expect(validateLine('Another {merchant} run this week', vi)).toEqual({
      ok: false,
      problem: 'wrongLanguage',
    });
    expect(validateLine('Café number {visits}, {merchant} knows you by name', en)).toEqual({
      ok: true,
    });
  });

  it('rejects words that put the person down, as whole words only', () => {
    expect(validateLine('Lazy week again at {merchant}?', en)).toEqual({
      ok: false,
      problem: 'shaming',
    });
    expect(validateLine('Bạn lười quá, {merchant} lại thắng', vi)).toEqual({
      ok: false,
      problem: 'shaming',
    });
    // "Nguyễn" holds "ngu" but is not the word.
    expect(validateLine('Chuyển cho Nguyễn {amount} rồi nha', vi)).toEqual({ ok: true });
  });

  it('rejects empty and over-long lines for the surface', () => {
    expect(validateLine('   ', en)).toEqual({ ok: false, problem: 'empty' });
    const long = `{merchant} ${'again '.repeat(22)}`;
    expect(validateLine(long, en)).toEqual({ ok: false, problem: 'tooLong' });
    expect(validateLine(long, { ...en, surface: 'answer' })).toEqual({ ok: true });
  });

  it('rejects a line that leaves out a fact, or is only a fragment', () => {
    const two = { ...en, facts: [['merchant', 'visits'], ['days']] };
    expect(validateLine('{merchant} again, {visits} since Monday', two)).toEqual({
      ok: false,
      problem: 'missingFact',
    });
    expect(validateLine('{merchant} again, and {days} days under your line', two)).toEqual({
      ok: true,
    });
    // Lines Apple's on-device model wrote: a lone word, and placeholders strung together.
    expect(validateLine('hũ', vi)).toEqual({ ok: false, problem: 'missingFact' });
    expect(validateLine('{visits}', en)).toEqual({ ok: false, problem: 'tooFewWords' });
    expect(validateLine('mình, hũ {merchant} {amount} {visits} nha', vi)).toEqual({
      ok: false,
      problem: 'tooFewWords',
    });
  });
});

describe('fillLine', () => {
  it('fills each placeholder and leaves unknown ones untouched', () => {
    expect(fillLine(' {merchant} x{visits} {other} ', { merchant: 'Highlands', visits: '4' })).toBe(
      'Highlands x4 {other}',
    );
  });

  it('lists placeholders once, in order', () => {
    expect(placeholdersOf('{a} {b} {a}')).toEqual(['a', 'b']);
  });
});
