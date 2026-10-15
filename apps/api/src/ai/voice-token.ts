import type { VoiceProvider, VoiceTokenResponse } from '@6pm/domain';

import { ApiError } from '../errors';

/** How long a minted token may open a connection. A session outlives its token once open. */
const DEEPGRAM_TTL_SECONDS = 30;
/** ElevenLabs' single-use tokens last this long and are spent on first use. */
const ELEVENLABS_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 5_000;

export type VoiceConfig = {
  /** `VOICE_PROVIDER`; anything but `elevenlabs` is Deepgram. */
  readonly provider: string | undefined;
  readonly deepgramKey: string | undefined;
  readonly elevenLabsKey: string | undefined;
  /** `ELEVENLABS_ZERO_RETENTION`: `true` once the account has zero retention (enterprise). */
  readonly elevenLabsZeroRetention: string | undefined;
};

export type MintedVoiceToken = {
  readonly response: VoiceTokenResponse;
  /** The model the phone will stream to, for the ledger. */
  readonly model: string;
};

export function voiceProviderOf(config: Pick<VoiceConfig, 'provider'>): VoiceProvider {
  return config.provider === 'elevenlabs' ? 'elevenlabs' : 'deepgram';
}

function unavailable(reason: string): ApiError {
  return new ApiError('model_unavailable', 'The transcriber is not available', { reason });
}

/** One call to the vendor's token endpoint; its status alone is reported, never its body. */
async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('model_timeout', 'The transcriber took too long');
    }
    throw unavailable('network');
  }
  if (!response.ok) throw unavailable(`status_${response.status}`);
  return response.json().catch(() => {
    throw unavailable('bad_response');
  });
}

/**
 * Deepgram Nova-3 streaming. The grant is a JWT that only has to be valid when the socket opens;
 * `mip_opt_out` keeps the audio out of Deepgram's model improvement programme, so it is kept only
 * while the request is processed.
 */
async function deepgram(key: string, language: 'en' | 'vi'): Promise<MintedVoiceToken> {
  const answer = (await post(
    'https://api.deepgram.com/v1/auth/grant',
    { Authorization: `Token ${key}` },
    { ttl_seconds: DEEPGRAM_TTL_SECONDS },
  )) as { access_token?: unknown; expires_in?: unknown } | null;
  const token = answer?.access_token;
  if (typeof token !== 'string' || token === '') throw unavailable('bad_response');
  const ttl = typeof answer?.expires_in === 'number' ? answer.expires_in : DEEPGRAM_TTL_SECONDS;
  return {
    model: 'nova-3',
    response: {
      provider: 'deepgram',
      token,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      url: 'wss://api.deepgram.com/v1/listen',
      params: {
        model: 'nova-3',
        language,
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        interim_results: 'true',
        smart_format: 'true',
        punctuate: 'true',
        endpointing: '500',
        utterance_end_ms: '1000',
        mip_opt_out: 'true',
      },
    },
  };
}

/**
 * ElevenLabs Scribe v2 Realtime. The single-use token goes in the socket's query. Its voice
 * detector commits each phrase after a pause. Logging can only be turned off on an account with
 * zero retention, which `zeroRetention` says it has.
 */
async function elevenLabs(
  key: string,
  language: 'en' | 'vi',
  zeroRetention: boolean,
): Promise<MintedVoiceToken> {
  const answer = (await post(
    'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
    { 'xi-api-key': key },
    {},
  )) as { token?: unknown } | null;
  const token = answer?.token;
  if (typeof token !== 'string' || token === '') throw unavailable('bad_response');
  return {
    model: 'scribe_v2_realtime',
    response: {
      provider: 'elevenlabs',
      token,
      expiresAt: new Date(Date.now() + ELEVENLABS_TTL_MS).toISOString(),
      url: 'wss://api.elevenlabs.io/v1/speech-to-text/realtime',
      params: {
        model_id: 'scribe_v2_realtime',
        language_code: language,
        audio_format: 'pcm_16000',
        commit_strategy: 'vad',
        vad_silence_threshold_secs: '1.2',
        ...(zeroRetention ? { enable_logging: 'false' } : {}),
      },
    },
  };
}

/** A short-lived token for the configured transcriber; `model_unavailable` without its key. */
export async function mintVoiceToken(
  config: VoiceConfig,
  language: 'en' | 'vi',
): Promise<MintedVoiceToken> {
  if (voiceProviderOf(config) === 'elevenlabs') {
    if (!config.elevenLabsKey) throw unavailable('no_key');
    return elevenLabs(config.elevenLabsKey, language, config.elevenLabsZeroRetention === 'true');
  }
  if (!config.deepgramKey) throw unavailable('no_key');
  return deepgram(config.deepgramKey, language);
}
