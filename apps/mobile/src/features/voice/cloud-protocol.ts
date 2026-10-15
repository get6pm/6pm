import type { VoiceProvider, VoiceTokenResponse } from '@6pm/domain';

/** What one message from the transcriber says. */
export type Reading =
  /** Words: `final` once settled; `pause` when the speaker stopped after them. */
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly final: boolean;
      readonly pause: boolean;
    }
  /** The speaker paused, with no new words. */
  | { readonly kind: 'pause' }
  /** Everything sent has been transcribed. */
  | { readonly kind: 'done' }
  /** The vendor refused or broke off the session. */
  | { readonly kind: 'error' }
  | { readonly kind: 'ignore' };

/** How the phone talks to one vendor's realtime WebSocket. */
export interface TranscriberProtocol {
  /** Where to connect and how the token goes along. */
  connect(token: VoiceTokenResponse): {
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
  };
  /** One chunk of 16 kHz mono 16-bit PCM (base64) as the vendor takes it. */
  audio(chunk: string): string | ArrayBuffer;
  /** What tells the vendor no more audio is coming. */
  finish(): readonly string[];
  read(message: string): Reading;
  /** Whether a reading after `finish` is the last one. */
  isLast(reading: Reading): boolean;
}

function withQuery(url: string, params: Readonly<Record<string, string>>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query === '' ? url : `${url}?${query}`;
}

function parse(message: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(message);
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const IGNORE: Reading = { kind: 'ignore' };

/** Base64 to bytes; Hermes has `atob`. */
export function bytesOf(chunk: string): ArrayBuffer {
  const binary = atob(chunk);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Deepgram's live endpoint: raw PCM as binary frames, the temporary token as a bearer header,
 * `Results` with `is_final` and `speech_final`, `UtteranceEnd` after a longer pause, and
 * `CloseStream` to flush the last words before Deepgram closes the socket.
 */
export const deepgram: TranscriberProtocol = {
  connect: (token) => ({
    url: withQuery(token.url, token.params),
    headers: { Authorization: `Bearer ${token.token}` },
  }),
  audio: bytesOf,
  finish: () => [JSON.stringify({ type: 'CloseStream' })],
  read: (message) => {
    const body = parse(message);
    switch (body?.['type']) {
      case 'Results': {
        const channel = body['channel'] as
          { alternatives?: { transcript?: unknown }[] } | undefined;
        const text = channel?.alternatives?.[0]?.transcript;
        return {
          kind: 'text',
          text: typeof text === 'string' ? text : '',
          final: body['is_final'] === true,
          pause: body['speech_final'] === true,
        };
      }
      case 'UtteranceEnd':
        return body['last_word_end'] === -1 ? IGNORE : { kind: 'pause' };
      case 'Metadata':
        return { kind: 'done' };
      case 'Error':
        return { kind: 'error' };
      default:
        return IGNORE;
    }
  },
  isLast: (reading) => reading.kind === 'done',
};

/** ElevenLabs' messages that end a session; any other `*_error`-like type is one too. */
const ELEVENLABS_ERRORS = new Set([
  'error',
  'auth_error',
  'quota_exceeded',
  'commit_throttled',
  'unaccepted_terms',
  'rate_limited',
  'queue_overflow',
  'resource_exhausted',
  'session_time_limit_exceeded',
  'input_error',
  'invalid_request',
  'chunk_size_exceeded',
  'transcriber_error',
]);

/**
 * ElevenLabs Scribe Realtime: PCM as base64 in JSON chunks, the single-use token in the query,
 * `partial_transcript` while a segment is spoken and `committed_transcript` once the voice
 * detector (or the closing commit) settles it.
 */
export const elevenlabs: TranscriberProtocol = {
  connect: (token) => ({
    url: withQuery(token.url, { ...token.params, token: token.token }),
    headers: {},
  }),
  audio: (chunk) =>
    JSON.stringify({
      message_type: 'input_audio_chunk',
      audio_base_64: chunk,
      commit: false,
      sample_rate: 16_000,
    }),
  finish: () => [
    JSON.stringify({
      message_type: 'input_audio_chunk',
      audio_base_64: '',
      commit: true,
      sample_rate: 16_000,
    }),
  ],
  read: (message) => {
    const body = parse(message);
    const type = body?.['message_type'];
    const text = typeof body?.['text'] === 'string' ? body['text'] : '';
    if (type === 'partial_transcript') return { kind: 'text', text, final: false, pause: false };
    if (type === 'committed_transcript') return { kind: 'text', text, final: true, pause: true };
    // Silence only: nothing more will come.
    if (type === 'insufficient_audio_activity') return { kind: 'done' };
    if (typeof type === 'string' && ELEVENLABS_ERRORS.has(type)) return { kind: 'error' };
    return IGNORE;
  },
  isLast: (reading) => reading.kind === 'done' || (reading.kind === 'text' && reading.final),
};

export function protocolFor(provider: VoiceProvider): TranscriberProtocol {
  return provider === 'elevenlabs' ? elevenlabs : deepgram;
}
