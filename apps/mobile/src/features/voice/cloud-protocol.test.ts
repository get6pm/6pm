import { describe, expect, it } from '@jest/globals';

import type { VoiceTokenResponse } from '@6pm/domain';

import { bytesOf, deepgram, elevenlabs } from './cloud-protocol';

const token = (provider: VoiceTokenResponse['provider']): VoiceTokenResponse => ({
  provider,
  token: 'secret token',
  expiresAt: '2026-10-15T12:00:30.000Z',
  url: 'wss://example.test/listen',
  params: { language: 'vi', sample_rate: '16000' },
});

describe('Deepgram', () => {
  it('connects with the query from the server and the token as a bearer header', () => {
    expect(deepgram.connect(token('deepgram'))).toEqual({
      url: 'wss://example.test/listen?language=vi&sample_rate=16000',
      headers: { Authorization: 'Bearer secret token' },
    });
  });

  it('sends the audio as raw bytes and closes the stream to flush the last words', () => {
    expect(new Uint8Array(bytesOf('AAH/fw=='))).toEqual(new Uint8Array([0, 1, 255, 127]));
    expect(deepgram.finish()).toEqual(['{"type":"CloseStream"}']);
  });

  it('reads guesses, settled words and the pause after them', () => {
    const result = (transcript: string, isFinal: boolean, speechFinal: boolean) =>
      JSON.stringify({
        type: 'Results',
        is_final: isFinal,
        speech_final: speechFinal,
        channel: { alternatives: [{ transcript, confidence: 0.9 }] },
      });
    expect(deepgram.read(result('phở', false, false))).toEqual({
      kind: 'text',
      text: 'phở',
      final: false,
      pause: false,
    });
    expect(deepgram.read(result('phở bốn lăm nghìn', true, true))).toEqual({
      kind: 'text',
      text: 'phở bốn lăm nghìn',
      final: true,
      pause: true,
    });
  });

  it('reads a long pause, the end of the stream and an error', () => {
    expect(deepgram.read('{"type":"UtteranceEnd","last_word_end":2.1}')).toEqual({ kind: 'pause' });
    expect(deepgram.read('{"type":"UtteranceEnd","last_word_end":-1}')).toEqual({ kind: 'ignore' });
    const done = deepgram.read('{"type":"Metadata","duration":3.2}');
    expect(done).toEqual({ kind: 'done' });
    expect(deepgram.isLast(done)).toBe(true);
    expect(deepgram.read('{"type":"Error","description":"bad"}')).toEqual({ kind: 'error' });
    expect(deepgram.read('not json')).toEqual({ kind: 'ignore' });
  });
});

describe('ElevenLabs', () => {
  it('connects with the single-use token in the query and no header', () => {
    expect(elevenlabs.connect(token('elevenlabs'))).toEqual({
      url: 'wss://example.test/listen?language=vi&sample_rate=16000&token=secret%20token',
      headers: {},
    });
  });

  it('sends audio as base64 chunks and a commit to finish', () => {
    expect(JSON.parse(elevenlabs.audio('AAH/fw==') as string)).toEqual({
      message_type: 'input_audio_chunk',
      audio_base_64: 'AAH/fw==',
      commit: false,
      sample_rate: 16_000,
    });
    expect(elevenlabs.finish().map((m) => JSON.parse(m) as unknown)).toEqual([
      { message_type: 'input_audio_chunk', audio_base_64: '', commit: true, sample_rate: 16_000 },
    ]);
  });

  it('reads partial and committed words, silence and errors', () => {
    expect(elevenlabs.read('{"message_type":"partial_transcript","text":"xôi"}')).toEqual({
      kind: 'text',
      text: 'xôi',
      final: false,
      pause: false,
    });
    const committed = elevenlabs.read(
      '{"message_type":"committed_transcript","text":"xôi hai mươi nghìn"}',
    );
    expect(committed).toEqual({
      kind: 'text',
      text: 'xôi hai mươi nghìn',
      final: true,
      pause: true,
    });
    expect(elevenlabs.isLast(committed)).toBe(true);
    expect(elevenlabs.read('{"message_type":"session_started","session_id":"s"}')).toEqual({
      kind: 'ignore',
    });
    expect(elevenlabs.read('{"message_type":"insufficient_audio_activity"}')).toEqual({
      kind: 'done',
    });
    for (const type of ['auth_error', 'quota_exceeded', 'rate_limited', 'transcriber_error']) {
      expect(elevenlabs.read(JSON.stringify({ message_type: type, error: 'x' }))).toEqual({
        kind: 'error',
      });
    }
  });
});
