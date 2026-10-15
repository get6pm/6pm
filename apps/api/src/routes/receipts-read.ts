import {
  RECEIPT_READ_MAX_BODY_BYTES,
  receiptReadRequestSchema,
  type ReceiptReadResponse,
} from '@6pm/domain';

import { readReceipt } from '../ai/read-receipt';
import { recordAiUsage } from '../ledger';
import { limitReceiptReads } from '../rate-limit';
import { readBody, type RouteDefinition } from '../route';

/**
 * Reads a receipt photo the phone could not be sure of, with the vision model. The photo is
 * passed to the model and dropped: it is never stored, and never logged (a failure logs its path
 * only). `receipt` is null when there is nothing to offer, and the phone keeps its own reading.
 */
export const receiptsReadRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/receipts/read',
  access: 'device',
  handle: async (c) => {
    await limitReceiptReads(c);
    const request = await readBody(c, receiptReadRequestSchema, {
      maxBytes: RECEIPT_READ_MAX_BODY_BYTES,
    });
    const read = await readReceipt({ apiKey: c.env.ANTHROPIC_API_KEY }, request);
    c.executionCtx.waitUntil(
      recordAiUsage(c.env.DB, {
        route: 'receipts.read',
        model: read.model,
        inputTokens: read.inputTokens,
        outputTokens: read.outputTokens,
        deviceHash: c.var.device.hash,
      }),
    );
    return c.json({ receipt: read.output } satisfies ReceiptReadResponse);
  },
};
