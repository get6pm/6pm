import { askRequestSchema } from '@6pm/domain';

import { readQuestion } from '../ai/read-question';
import { recordAiUsage } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

/**
 * Reads a question to Ask 6pm into an intent. The phone sends the question alone and works out
 * every number of the answer itself, so the server never sees the user's money.
 */
export const askRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/ask',
  access: 'device',
  handle: async (c) => {
    const { question } = await readBody(c, askRequestSchema, { maxBytes: 2_000 });
    const generated = await readQuestion({ apiKey: c.env.ANTHROPIC_API_KEY }, question);
    c.executionCtx.waitUntil(
      recordAiUsage(c.env.DB, {
        route: 'ask.read',
        model: generated.model,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        deviceHash: c.var.device.hash,
      }),
    );
    return c.json(generated.output);
  },
};
