import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { VoiceTokenResponse } from '@6pm/domain';

import {
  FINISH_TIMEOUT_MS,
  OPEN_TIMEOUT_MS,
  SILENCE_TIMEOUT_MS,
  openCloudSession,
  type SocketLike,
} from './cloud-session';

const deepgramToken: VoiceTokenResponse = {
  provider: 'deepgram',
  token: 'jwt',
  expiresAt: '2026-10-15T12:00:30.000Z',
  url: 'wss://example.test/listen',
  params: {},
};

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 0;
  sent: (string | ArrayBuffer)[] = [];
  closed = false;
  send(data: string | ArrayBuffer) {
    this.sent.push(data);
  }
  close() {
    this.closed = true;
  }
  opens() {
    this.readyState = 1;
    this.onopen?.();
  }
  says(text: string, isFinal: boolean, speechFinal = false) {
    this.onmessage?.({
      data: JSON.stringify({
        type: 'Results',
        is_final: isFinal,
        speech_final: speechFinal,
        channel: { alternatives: [{ transcript: text }] },
      }),
    });
  }
}

function start(hold: boolean) {
  const socket = new FakeSocket();
  const heard: [string, boolean][] = [];
  const ended = jest.fn();
  const failed = jest.fn();
  const session = openCloudSession({
    token: deepgramToken,
    hold,
    open: () => socket,
    events: { heard: (text, final) => heard.push([text, final]), ended, failed },
  });
  return { socket, session, heard, ended, failed };
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('a cloud transcription', () => {
  it('holds the first audio until the socket opens, then sends it in order', () => {
    const { socket, session } = start(true);
    session.send('AA==');
    session.send('AQ==');
    expect(socket.sent).toEqual([]);
    socket.opens();
    session.send('Ag==');
    expect(socket.sent.map((b) => new Uint8Array(b as ArrayBuffer)[0])).toEqual([0, 1, 2]);
  });

  it('streams words while held and ends once the last words arrive after the release', () => {
    const { socket, session, heard, ended } = start(true);
    socket.opens();
    socket.says('trà sữa', false);
    socket.says('trà sữa bốn lăm k', true, true);
    expect(ended).not.toHaveBeenCalled();
    session.finish();
    expect(socket.sent.at(-1)).toBe('{"type":"CloseStream"}');
    socket.onmessage?.({ data: '{"type":"Metadata"}' });
    expect(heard).toEqual([
      ['trà sữa', false],
      ['trà sữa bốn lăm k', true],
    ]);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(socket.closed).toBe(true);
  });

  it('in tap mode stops at the first pause after speech', () => {
    const { socket, ended } = start(false);
    socket.opens();
    socket.says('xôi', true, false);
    expect(ended).not.toHaveBeenCalled();
    socket.onmessage?.({ data: '{"type":"UtteranceEnd","last_word_end":1.2}' });
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('in tap mode ends when nothing is said for a while', () => {
    const { socket, ended, failed } = start(false);
    socket.opens();
    jest.advanceTimersByTime(SILENCE_TIMEOUT_MS);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(failed).not.toHaveBeenCalled();
  });

  it('fails, for Apple to take over, when the socket breaks before any words', () => {
    const { socket, ended, failed } = start(true);
    socket.opens();
    socket.onerror?.();
    expect(failed).toHaveBeenCalledTimes(1);
    expect(ended).not.toHaveBeenCalled();
  });

  it('fails when the socket does not open in time', () => {
    const { failed } = start(true);
    jest.advanceTimersByTime(OPEN_TIMEOUT_MS);
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it('keeps the words heard when the socket breaks after them', () => {
    const { socket, ended, failed } = start(true);
    socket.opens();
    socket.says('phở', true);
    socket.onclose?.();
    expect(ended).toHaveBeenCalledTimes(1);
    expect(failed).not.toHaveBeenCalled();
  });

  it('ends after the release even when the last words never come', () => {
    const { socket, session, ended } = start(true);
    socket.opens();
    socket.says('phở', false);
    session.finish();
    jest.advanceTimersByTime(FINISH_TIMEOUT_MS);
    expect(ended).toHaveBeenCalledTimes(1);
  });

  it('reports nothing after an abort', () => {
    const { socket, session, heard, ended, failed } = start(true);
    socket.opens();
    session.abort();
    socket.says('phở', true);
    jest.advanceTimersByTime(OPEN_TIMEOUT_MS + FINISH_TIMEOUT_MS);
    expect(heard).toEqual([]);
    expect(ended).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
    expect(socket.closed).toBe(true);
  });
});
