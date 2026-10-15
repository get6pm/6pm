import { voiceTokenRequestSchema } from '@6pm/domain';

import { mintVoiceToken } from '../ai/voice-token';
import { recordAiUsage, requireAiBudget } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

/**
 * Transcriptions one device may start in a UTC day. Free members get ten a day on the phone and
 * Max has no cap there; this only stops a runaway client from spending the transcriber budget.
 */
const voiceTokensPerDay = 200;

/**
 * Mints a short-lived key to the realtime transcriber for one spend said aloud. The phone then
 * streams its microphone to the vendor directly: no audio and no words pass through this server.
 * Each key is a row in the cost ledger, with no tokens counted.
 */
export const voiceTokenRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/voice/token',
  access: 'device',
  handle: async (c) => {
    const request = await readBody(c, voiceTokenRequestSchema, { maxBytes: 1_000 });
    await requireAiBudget(c.env.DB, c.var.device.hash, 'voice.token', voiceTokensPerDay);
    const minted = await mintVoiceToken(
      {
        provider: c.env.VOICE_PROVIDER,
        deepgramKey: c.env.DEEPGRAM_API_KEY,
        elevenLabsKey: c.env.ELEVENLABS_API_KEY,
        elevenLabsZeroRetention: c.env.ELEVENLABS_ZERO_RETENTION,
      },
      request.language,
    );
    c.executionCtx.waitUntil(
      recordAiUsage(c.env.DB, {
        route: 'voice.token',
        model: minted.model,
        inputTokens: 0,
        outputTokens: 0,
        deviceHash: c.var.device.hash,
      }),
    );
    return c.json(minted.response);
  },
};
