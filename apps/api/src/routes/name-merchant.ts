import { nameMerchant, nameMerchantRequestSchema } from '../ai/name-merchant';
import { recordAiUsage } from '../ledger';
import { readBody, type RouteDefinition } from '../route';

/**
 * Names the payee of a receipt shared to 6pm when the phone could not be sure of it and no rule
 * of the user's knew the name. The phone sends the receipt's lines with every number taken out:
 * a body holding a digit is turned away before the model is called.
 */
export const nameMerchantRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/name-merchant',
  access: 'device',
  handle: async (c) => {
    const request = await readBody(c, nameMerchantRequestSchema, { maxBytes: 12_000 });
    const generated = await nameMerchant({ apiKey: c.env.ANTHROPIC_API_KEY }, request);
    c.executionCtx.waitUntil(
      recordAiUsage(c.env.DB, {
        route: 'name-merchant',
        model: generated.model,
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        deviceHash: c.var.device.hash,
      }),
    );
    return c.json(generated.output);
  },
};
