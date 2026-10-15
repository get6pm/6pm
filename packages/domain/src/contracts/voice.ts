import { z } from 'zod';

/**
 * `POST /v1/voice/token`: a short-lived key for one realtime transcription, minted by the server
 * so the vendor's own key never reaches the phone. The phone streams the microphone straight to
 * the vendor at `url` with `params` added to the query; no audio passes through the server.
 */
export const VOICE_PROVIDERS = ['deepgram', 'elevenlabs'] as const;
export type VoiceProvider = (typeof VOICE_PROVIDERS)[number];

export const voiceTokenRequestSchema = z.object({
  /** The language spoken: the app's language. */
  language: z.enum(['en', 'vi']),
});
export type VoiceTokenRequest = z.input<typeof voiceTokenRequestSchema>;

export const voiceTokenResponseSchema = z.object({
  provider: z.enum(VOICE_PROVIDERS),
  /** Opens one connection; it is passed the way `provider` expects, never logged. */
  token: z.string().min(1),
  /** When the token stops opening connections, ISO 8601. */
  expiresAt: z.string(),
  /** The vendor's WebSocket, without a query. */
  url: z.string().url(),
  /** The query the connection opens with: model, language, audio format, retention. */
  params: z.record(z.string(), z.string()),
});
export type VoiceTokenResponse = z.infer<typeof voiceTokenResponseSchema>;
