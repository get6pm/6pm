import { LINE_MAX_LENGTH, readUtcOffset, UTC_OFFSET_HEADER, wordRequestSchema } from '@6pm/domain';

import { wordLine } from '../ai/word-line';
import { recordAiUsage, requireAiBudget } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

/**
 * Lines one device may have worded in a day, from midnight on the user's clock. The phone words a
 * moment's lines ahead and caps itself well under this; it only stops a runaway client from
 * spending the model budget.
 */
const wordsPerDay = 40;

/**
 * Words facts the phone computed in the companion's voice: Ask answers and the companion's lines.
 * The phone sends the facts' formatted values and gets a line back with placeholders, which it
 * checks and fills itself. Nothing but the facts for this one line is sent.
 */
export const wordRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/word',
  access: 'device',
  handle: async (c) => {
    const request = await readBody(c, wordRequestSchema, { maxBytes: 8_000 });
    await requireAiBudget(
      c.env.DB,
      c.var.device.hash,
      'word',
      wordsPerDay,
      readUtcOffset(c.req.header(UTC_OFFSET_HEADER)),
    );
    const generated = await wordLine(
      { apiKey: c.env.ANTHROPIC_API_KEY },
      request,
      LINE_MAX_LENGTH[request.surface],
    );
    c.executionCtx.waitUntil(
      recordAiUsage(c.env.DB, {
        route: request.surface === 'answer' ? 'word.ask' : 'word.companion',
        model: generated.model,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        deviceHash: c.var.device.hash,
      }),
    );
    return c.json(generated.output);
  },
};
