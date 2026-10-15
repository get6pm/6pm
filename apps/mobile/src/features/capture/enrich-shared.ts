import { z } from 'zod';

import type { InboxSpend } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { requireServerAi, type AiModeSettings } from '../privacy/ai-mode';

/** One attempt, kept short: the import waits for it, and a slow answer keeps the read name. */
export const NAME_MERCHANT_TIMEOUT_MS = 3_000;

const digit = /\p{Nd}/u;
const digits = /\p{Nd}/gu;
const MAX_LINES = 60;
const MAX_LINE = 120;
const MAX_NAME = 80;
const MAX_CATEGORIES = 50;
const MAX_CATEGORY = 40;

const namedSchema = z.object({ merchant: z.string(), category: z.string() });

export interface EnrichSharedDeps {
  readonly request: ApiClient['request'];
  /** Where 6pm's AI runs: in on-device mode the receipt keeps the name the phone read. */
  readonly settings: AiModeSettings;
  /** The category the user's rule files this merchant under, or null when no rule knows it. */
  readonly ruleCategory: (merchant: string) => Promise<string | null>;
  /** The user's categories now. */
  readonly categories: () => readonly { readonly id: string; readonly name: string }[];
}

/**
 * What 6pm adds to a shared receipt before saving it: when the extension was not sure of the
 * payee and no rule of the user's knows the name, the server reads the receipt's number-free
 * lines and names who was paid, choosing among the user's categories. No digit is ever sent.
 * Offline, slow or refused, and always in on-device mode, the receipt is saved with the name the
 * extension read. The category
 * the extension filed (or the user picked there) stays; the server's is used only when it filed
 * none.
 */
export function createEnrichShared(deps: EnrichSharedDeps) {
  return async (item: InboxSpend): Promise<InboxSpend> => {
    const receipt = item.receipt;
    if (receipt?.payeeSure !== false) return item;
    const ruled = await deps.ruleCategory(item.merchant).catch(() => null);
    if (ruled !== null) return item;

    const lines = receipt.namingLines
      .map((line) => line.trim().slice(0, MAX_LINE))
      .filter((line) => line !== '' && !digit.test(line))
      .slice(0, MAX_LINES);
    const categories = deps
      .categories()
      .filter((c) => c.name.trim() !== '' && c.name.length <= MAX_CATEGORY && !digit.test(c.name))
      .slice(0, MAX_CATEGORIES);
    if (lines.length === 0 || categories.length === 0) return item;

    try {
      requireServerAi(deps.settings, 'name-merchant');
      const named = await deps.request({
        method: 'POST',
        path: '/v1/name-merchant',
        body: {
          name: item.merchant.replace(digits, '').trim().slice(0, MAX_NAME),
          lines,
          categories: categories.map((c) => c.name),
        },
        schema: namedSchema,
        timeoutMs: NAME_MERCHANT_TIMEOUT_MS,
      });
      const merchant = named.merchant.trim();
      const category = categories.find((c) => c.name === named.category);
      return {
        ...item,
        merchant: merchant === '' ? item.merchant : merchant,
        categoryId: item.categoryId ?? category?.id ?? null,
      };
    } catch {
      return item;
    }
  };
}
