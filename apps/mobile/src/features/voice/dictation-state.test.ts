import { describe, expect, it } from '@jest/globals';

import {
  dictationReducer,
  heardText,
  initialDictation,
  mergeHeard,
  type DictationEvent,
  type DictationState,
} from './dictation-state';

const run = (events: readonly DictationEvent[], from: DictationState = initialDictation) =>
  events.reduce(dictationReducer, from);

const heard = (text: string, final = false): DictationEvent => ({ type: 'heard', text, final });

describe('dictationReducer', () => {
  it('listens, streams the words, and reads the spend once the finger lifts', () => {
    const listening = run([{ type: 'start' }, heard('trà sữa with'), heard('trà sữa with pearls')]);
    expect(listening.phase).toBe('listening');
    expect(heardText(listening)).toBe('trà sữa with pearls');

    const done = run(
      [heard('trà sữa with pearls, forty-five k', true), { type: 'release' }, { type: 'end' }],
      listening,
    );
    expect(done.phase).toBe('parsed');
    expect(done.spend).toEqual({ name: 'Trà sữa', amount: 45_000, categoryHint: 'drinks' });
    expect(heardText(done)).toBe('trà sữa with pearls, forty-five k');
  });

  it('waits for the last words after the release', () => {
    const finishing = run([{ type: 'start' }, heard('veggies and eggs'), { type: 'release' }]);
    expect(finishing.phase).toBe('finishing');
    const done = run(
      [heard('veggies and eggs at the market, thirty-five k', true), { type: 'end' }],
      finishing,
    );
    expect(done.phase).toBe('parsed');
    expect(done.spend).toEqual({
      name: 'Veggies & eggs',
      amount: 35_000,
      categoryHint: 'groceries',
    });
  });

  it('says nothing was heard when the recogniser ends empty or hears no speech', () => {
    expect(run([{ type: 'start' }, { type: 'release' }, { type: 'end' }]).phase).toBe('nothing');
    expect(run([{ type: 'start' }, { type: 'failed', error: 'no-speech' }]).phase).toBe('nothing');
    expect(run([{ type: 'start' }, heard('   '), { type: 'end' }]).phase).toBe('nothing');
  });

  it('keeps the words but no amount when none was said', () => {
    const done = run([{ type: 'start' }, heard('phở at the corner', true), { type: 'end' }]);
    expect(done.phase).toBe('noAmount');
    expect(done.spend).toEqual({ name: 'Phở', amount: null, categoryHint: 'food' });
  });

  it('still reads what was heard when the recogniser fails part way', () => {
    const done = run([
      { type: 'start' },
      heard('xôi hai mươi nghìn'),
      { type: 'failed', error: 'interrupted' },
    ]);
    expect(done.phase).toBe('parsed');
    expect(done.spend?.amount).toBe(20_000);
  });

  it('goes back to idle when listening is stopped from the app', () => {
    expect(run([{ type: 'start' }, heard('phở'), { type: 'failed', error: 'aborted' }])).toEqual(
      initialDictation,
    );
  });

  it('marks the microphone off and the language unavailable from their errors', () => {
    expect(run([{ type: 'start' }, { type: 'failed', error: 'not-allowed' }]).phase).toBe('denied');
    for (const error of ['language-not-supported', 'service-not-allowed']) {
      expect(run([{ type: 'start' }, { type: 'failed', error }]).phase).toBe('unavailable');
    }
  });

  it('never listens once the language is unavailable', () => {
    const off = run([{ type: 'unavailable' }]);
    expect(run([{ type: 'start' }, { type: 'reset' }, { type: 'denied' }], off)).toBe(off);
  });

  it('listens again after a denial once the user turned the microphone on', () => {
    expect(run([{ type: 'denied' }, { type: 'start' }]).phase).toBe('listening');
  });

  it('starts fresh on each hold and ignores words outside one', () => {
    const first = run([{ type: 'start' }, heard('phở 45k', true), { type: 'end' }]);
    expect(run([heard('ignored')], first)).toBe(first);
    const second = run([{ type: 'start' }], first);
    expect(second).toEqual({ ...initialDictation, phase: 'listening' });
  });
});

describe('mergeHeard', () => {
  it('appends a result that starts over after a pause', () => {
    expect(mergeHeard('trà sữa with pearls', ' forty-five k')).toBe(
      'trà sữa with pearls forty-five k',
    );
  });

  it('replaces the words when a result repeats everything said', () => {
    expect(mergeHeard('trà sữa', 'Trà sữa forty-five k')).toBe('Trà sữa forty-five k');
  });

  it('keeps what it has when a result is empty', () => {
    expect(mergeHeard('phở', '')).toBe('phở');
    expect(mergeHeard('', ' phở ')).toBe('phở');
  });
});
