import { askRequestSchema, readUtcOffset, UTC_OFFSET_HEADER } from '@6pm/domain';

import { readQuestion } from '../ai/read-question';
import { recordAiUsage, requireAiBudget } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

/**
 * Questions one device may have read in a day, from midnight on the user's clock. Free members get
 * ten a day, counted on the phone; this only stops a runaway client from spending the model budget.
 */
const askReadsPerDay = 60;

/**
 * Reads a question to Ask 6pm into a query (and the intent older phones read). The phone sends
 * the question with its category and pot names and works out every number of the answer itself,
 * so the server never sees the user's money.
 */
export const askRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/ask',
  access: 'device',
  handle: async (c) => {
    const request = await readBody(c, askRequestSchema, { maxBytes: 8_000 });
    await requireAiBudget(
      c.env.DB,
      c.var.device.hash,
      'ask.read',
      askReadsPerDay,
      readUtcOffset(c.req.header(UTC_OFFSET_HEADER)),
    );
    const generated = await readQuestion({ apiKey: c.env.ANTHROPIC_API_KEY }, request);
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
