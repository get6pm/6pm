import { describe, expect, it } from '@jest/globals';

import { mainAction, micAction, voiceStage } from './voice-stage';

describe('voiceStage', () => {
  it('is closed whatever the dictation did while the panel is shut', () => {
    expect(voiceStage(false, 'parsed')).toBe('closed');
    expect(voiceStage(false, 'unavailable')).toBe('closed');
  });

  it('follows the dictation while open', () => {
    expect(voiceStage(true, 'idle')).toBe('waiting');
    expect(voiceStage(true, 'listening')).toBe('listening');
    expect(voiceStage(true, 'finishing')).toBe('reading');
    expect(voiceStage(true, 'parsed')).toBe('heard');
    expect(voiceStage(true, 'noAmount')).toBe('noAmount');
    expect(voiceStage(true, 'nothing')).toBe('nothing');
    expect(voiceStage(true, 'denied')).toBe('denied');
  });
});

describe('the panel buttons', () => {
  it('starts from the keypad and tries again after a miss', () => {
    expect(micAction('closed')).toBe('start');
    expect(micAction('nothing')).toBe('start');
    expect(micAction('noAmount')).toBe('start');
  });

  it('stops while listening, from either button', () => {
    expect(micAction('listening')).toBe('stop');
    expect(mainAction('listening')).toBe('stop');
  });

  it('does nothing on the microphone while the words are read or settings are needed', () => {
    expect(micAction('reading')).toBe('none');
    expect(micAction('heard')).toBe('none');
    expect(micAction('denied')).toBe('none');
    expect(micAction('unavailable')).toBe('none');
  });

  it('keeps the spend from the keypad and cancels everywhere else', () => {
    expect(mainAction('closed')).toBe('keep');
    expect(mainAction('reading')).toBe('cancel');
    expect(mainAction('heard')).toBe('cancel');
    expect(mainAction('denied')).toBe('cancel');
  });
});
