import { voiceTokenResponseSchema, type VoiceTokenResponse } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { micStream } from '../../../modules/mic-stream';
import type { ApiClient } from '../api/api-client';
import {
  openCloudSession,
  type CloudSession,
  type CloudSessionEvents,
  type SocketLike,
} from './cloud-session';

/** The token is asked for while the microphone already listens: a slow answer falls back. */
export const VOICE_TOKEN_TIMEOUT_MS = 3_000;

export interface CloudListener {
  /** The finger lifted: the last words arrive, then `ended`. */
  readonly stop: () => void;
  /** Closes everything with nothing more reported. */
  readonly abort: () => void;
}

/** React Native's WebSocket takes a third argument the DOM one lacks: headers, sent on iOS. */
type NativeWebSocket = new (
  url: string,
  protocols: null,
  options: { readonly headers: Record<string, string> },
) => SocketLike;

/** The vendor's WebSocket, with the token header when the vendor wants one. */
function openSocket(url: string, headers: Readonly<Record<string, string>>): SocketLike {
  const Socket = WebSocket as unknown as NativeWebSocket;
  return new Socket(url, null, { headers: { ...headers } });
}

/** Asks the server for a short-lived key to the transcriber. */
export function fetchVoiceToken(
  request: ApiClient['request'],
  language: Language,
): Promise<VoiceTokenResponse> {
  return request({
    method: 'POST',
    path: '/v1/voice/token',
    body: { language },
    schema: voiceTokenResponseSchema,
    timeoutMs: VOICE_TOKEN_TIMEOUT_MS,
  });
}

/**
 * Listens through the cloud transcriber: the microphone starts at once and its audio is held
 * while the server mints a token and the socket opens. `minted` fires once a token is in hand
 * (one transcription used). Every failure before words, from the microphone to the socket,
 * reports `failed` with the microphone already released, so Apple's recogniser can take it.
 */
export function listenInCloud({
  request,
  language,
  hold,
  minted,
  events,
}: {
  readonly request: ApiClient['request'];
  readonly language: Language;
  readonly hold: boolean;
  readonly minted: () => void;
  readonly events: CloudSessionEvents;
}): CloudListener {
  const early: string[] = [];
  let session: CloudSession | null = null;
  let over = false;
  let stopped = false;

  const release = async () => {
    audio?.remove();
    interrupted?.remove();
    await micStream?.stop().catch(() => undefined);
  };
  const finish = (report: () => void) => {
    if (over) return;
    over = true;
    session?.abort();
    void release().then(report);
  };
  const failed = () => finish(events.failed);
  const stop = () => {
    if (stopped || over) return;
    stopped = true;
    void micStream?.stop().catch(() => undefined);
    session?.finish();
  };

  const audio = micStream?.addListener('onAudio', ({ chunk }) => {
    if (session) session.send(chunk);
    else if (!stopped) early.push(chunk);
  });
  // The system took the microphone (a call, Siri): end with what was heard, as a lifted finger
  // would.
  const interrupted = micStream?.addListener('onStop', stop);

  const run = async () => {
    if (!micStream) throw new Error('No microphone stream in this build');
    await micStream.start();
    const token = await fetchVoiceToken(request, language);
    if (over) return;
    minted();
    session = openCloudSession({
      token,
      hold,
      open: openSocket,
      events: {
        heard: (text, final) => !over && events.heard(text, final),
        ended: () => finish(events.ended),
        failed,
      },
    });
    for (const chunk of early.splice(0)) session.send(chunk);
    if (stopped) session.finish();
  };
  run().catch(failed);

  return {
    stop,
    abort: () => {
      if (over) return;
      over = true;
      session?.abort();
      void release();
    },
  };
}
