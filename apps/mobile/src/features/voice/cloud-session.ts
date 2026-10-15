import type { VoiceTokenResponse } from '@6pm/domain';

import { protocolFor } from './cloud-protocol';

/** The part of a WebSocket the session uses, so tests can stand one in. */
export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  readonly readyState: number;
  send(data: string | ArrayBuffer): void;
  close(): void;
}

export type OpenSocket = (url: string, headers: Readonly<Record<string, string>>) => SocketLike;

export interface CloudSessionEvents {
  /** Words from the transcriber: `final` once it settled on them, a guess before. */
  readonly heard: (text: string, final: boolean) => void;
  /** Everything said has arrived. */
  readonly ended: () => void;
  /** The connection failed before any words: another recogniser can take over. */
  readonly failed: () => void;
}

export interface CloudSession {
  /** One chunk of 16 kHz mono 16-bit PCM, base64. Held until the socket opens. */
  readonly send: (chunk: string) => void;
  /** No more audio: the last words arrive, then `ended`. */
  readonly finish: () => void;
  /** Closes at once with nothing more reported. */
  readonly abort: () => void;
}

/** How long the socket may take to open before Apple's recogniser takes over. */
export const OPEN_TIMEOUT_MS = 3_000;
/** How long the last words may take after the audio stops. */
export const FINISH_TIMEOUT_MS = 2_500;
/** Tap mode with nothing said for this long ends like a pause would. */
export const SILENCE_TIMEOUT_MS = 8_000;
/** No spend takes longer than this to say. */
export const MAX_SESSION_MS = 60_000;
/** Audio held while the socket opens: ten seconds of chunks. */
const MAX_HELD_CHUNKS = 100;

const OPEN = 1;

/**
 * One realtime transcription over the vendor's WebSocket. `hold` keeps listening until `finish`;
 * otherwise the session ends at the first pause after speech, like Apple's recogniser does.
 * Audio that arrives before the socket opens is held and sent in order, so the first words are
 * not lost to the connection. A failure before any words reports `failed`; after words (or after
 * `finish`) the session ends with what it heard.
 */
export function openCloudSession({
  token,
  hold,
  open,
  events,
}: {
  readonly token: VoiceTokenResponse;
  readonly hold: boolean;
  readonly open: OpenSocket;
  readonly events: CloudSessionEvents;
}): CloudSession {
  const protocol = protocolFor(token.provider);
  const { url, headers } = protocol.connect(token);
  const held: string[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let socket: SocketLike | null = null;
  let done = false;
  let opened = false;
  let finishing = false;
  let heardAny = false;

  const after = (ms: number, run: () => void) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      run();
    }, ms);
    timers.add(timer);
  };
  const close = () => {
    done = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (!socket) return;
    socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
    try {
      socket.close();
    } catch {
      // Already closed.
    }
  };
  const end = () => {
    if (done) return;
    close();
    events.ended();
  };
  const fail = () => {
    if (done) return;
    // Words already heard, or the speaker already done: keep what there is.
    if (heardAny || finishing) return end();
    close();
    events.failed();
  };
  const sendFinish = () => {
    if (socket?.readyState !== OPEN) return;
    for (const message of protocol.finish()) socket.send(message);
  };

  try {
    socket = open(url, headers);
  } catch {
    // No socket at all: report on the next tick, once the caller holds the session.
    after(0, fail);
  }

  if (socket) {
    const live = socket;
    live.onopen = () => {
      if (done) return;
      opened = true;
      for (const chunk of held.splice(0)) live.send(protocol.audio(chunk));
      if (finishing) sendFinish();
    };
    live.onmessage = ({ data }) => {
      if (done || typeof data !== 'string') return;
      const reading = protocol.read(data);
      if (reading.kind === 'error') return fail();
      if (reading.kind === 'text') {
        if (reading.text.trim() !== '') heardAny = true;
        events.heard(reading.text, reading.final);
      }
      if (finishing && protocol.isLast(reading)) return end();
      if (hold) return;
      // Tap mode stops at the first pause after speech, as Apple's recogniser does.
      const paused = reading.kind === 'pause' || (reading.kind === 'text' && reading.pause);
      if ((paused && heardAny) || reading.kind === 'done') end();
    };
    live.onerror = fail;
    live.onclose = () => (finishing ? end() : fail());
    after(OPEN_TIMEOUT_MS, () => !opened && fail());
    after(MAX_SESSION_MS, end);
    if (!hold) after(SILENCE_TIMEOUT_MS, () => !heardAny && end());
  }

  return {
    send: (chunk) => {
      if (done || finishing) return;
      if (opened && socket) socket.send(protocol.audio(chunk));
      else if (held.length < MAX_HELD_CHUNKS) held.push(chunk);
    },
    finish: () => {
      if (done || finishing) return;
      finishing = true;
      // Before the socket opened there is nothing to wait for but the held audio's words.
      if (opened) sendFinish();
      after(FINISH_TIMEOUT_MS, end);
    },
    abort: () => {
      if (!done) close();
    },
  };
}
