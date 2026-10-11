import { askRequestSchema, askResponseSchema } from '@6pm/domain';

import { generate } from '../ai/deepseek';
import { recordAiUsage } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

const system = `You read one question a person asks their daily money app, 6pm, in English or Vietnamese, and say what it is about. You never answer it and never work out money: the phone does that.

Kinds:
- afford: they ask whether they can spend an amount ("Can I afford 2tr on Saturday?", "mua giày 1tr5 được không"). amount = whole Vietnamese đồng.
- weekend: how much they can spend this weekend.
- saveMore: what saving an extra amount would do (amount in đồng; 500000 if none is said).
- potFull: when a savings pot fills; pot = the pot's name exactly as they wrote it, if they named one.
- today: how much they can spend today.
- unknown: anything else.

Amounts: "k"/"nghìn"/"ngàn" ×1.000; "tr"/"triệu"/"củ"/"m" ×1.000.000; "1tr5" = 1.500.000; "rưỡi" adds half the unit; a bare number under 1000 means thousands; "$" amounts are not đồng: use unknown.`;

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
    const generated = await generate(
      { apiKey: c.env.DEEPSEEK_API_KEY },
      {
        tier: 'fast',
        system,
        prompt: question,
        tool: { name: 'read_question', description: 'What the question is about.' },
        schema: askResponseSchema,
        maxTokens: 200,
      },
    );
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
