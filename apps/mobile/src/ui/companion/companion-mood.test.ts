import { describe, expect, it } from '@jest/globals';

import { companionMood } from './companion-mood';

const afternoon = { hour: 15, serious: false, safe: 49_000, toast: false };

describe('companionMood', () => {
  it('is calm through the day', () => {
    expect(companionMood(afternoon)).toBe('calm');
    expect(companionMood({ ...afternoon, hour: 9 })).toBe('calm');
    expect(companionMood({ ...afternoon, hour: 21.49 })).toBe('calm');
  });

  it('waves in the morning and gets sleepy late in the evening', () => {
    expect(companionMood({ ...afternoon, hour: 7.5 })).toBe('wave');
    expect(companionMood({ ...afternoon, hour: 21.5 })).toBe('sleepy');
    expect(companionMood({ ...afternoon, hour: 23.75 })).toBe('sleepy');
  });

  it('nods along with an overspent open day, whatever the hour', () => {
    expect(companionMood({ ...afternoon, safe: -12_000 })).toBe('nod');
    expect(companionMood({ ...afternoon, safe: -12_000, hour: 22 })).toBe('nod');
    expect(companionMood({ ...afternoon, safe: -12_000, hour: 8 })).toBe('nod');
    expect(companionMood({ ...afternoon, safe: 0 })).toBe('calm');
  });

  it('stops nodding once the day is closed', () => {
    expect(companionMood({ ...afternoon, safe: -12_000, closed: true })).toBe('calm');
    expect(companionMood({ ...afternoon, safe: -12_000, closed: true, hour: 22 })).toBe('sleepy');
  });

  it('is happy while a toast shows', () => {
    expect(companionMood({ ...afternoon, toast: true })).toBe('happy');
    expect(companionMood({ ...afternoon, toast: true, safe: -12_000, hour: 22 })).toBe('happy');
  });

  it('is plain in serious mode, over everything else', () => {
    expect(companionMood({ ...afternoon, serious: true })).toBe('plain');
    expect(companionMood({ ...afternoon, serious: true, toast: true, safe: -1, hour: 7 })).toBe(
      'plain',
    );
  });
});
