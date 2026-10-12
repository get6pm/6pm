import { z } from 'zod';

import { generate, type DeepseekConfig, type Generated } from './deepseek';

/** Any decimal digit, in any script. A receipt's numbers never leave the phone. */
const digit = /\p{Nd}/u;

const numberFree = (max: number) =>
  z
    .string()
    .max(max)
    .refine((text) => !digit.test(text), { message: 'digits are not accepted' });

/**
 * What the phone sends to name a shared receipt's payee: the name it read, the receipt's lines
 * with every number taken out, and the names of the user's categories. Nothing else about the
 * user or their money.
 */
export const nameMerchantRequestSchema = z.object({
  name: numberFree(80),
  lines: z.array(numberFree(120)).min(1).max(60),
  categories: z
    .array(numberFree(40).pipe(z.string().trim().min(1)))
    .min(1)
    .max(50),
});
export type NameMerchantRequest = z.infer<typeof nameMerchantRequestSchema>;

/**
 * The model's answer, limited to the categories the phone sent. An empty merchant means the
 * receipt does not say who was paid, and the phone keeps the name it read.
 */
export function nameMerchantOutputSchema(categories: readonly string[]) {
  const [first, ...rest] = categories;
  if (first === undefined) throw new Error('nameMerchantOutputSchema needs a category');
  return z.object({
    merchant: z.string().trim().max(60),
    category: z.enum([first, ...rest]),
  });
}
export type NameMerchantOutput = z.infer<ReturnType<typeof nameMerchantOutputSchema>>;

export const nameMerchantSystem = `You read a Vietnamese bank transfer receipt that a person shared to their money app, 6pm, and say who they paid and which of their categories the payment belongs in. Every number on the receipt has been removed.

merchant: the shop, brand or person paid, written the way people say it ("Circle K", "Highlands Coffee", "Phở Hòa", "Nguyễn Văn An"). Drop legal words (CÔNG TY, TNHH, CP, JSC, CHI NHÁNH, VN, VIETNAM) and bank words (chuyển khoản, CK, thanh toán, QR). Use title case unless it is a brand written otherwise. When the receipt does not say who was paid, give an empty merchant.
category: exactly one of the category names given, copied as written. Pick the one the merchant is most likely for; a person's name with no other hint goes to the closest everyday category.`;

/** The prompt for one receipt: the read name, the lines, and the categories to choose from. */
export function nameMerchantPrompt(request: NameMerchantRequest): string {
  return [
    `Name read on the phone: ${request.name === '' ? '(none)' : request.name}`,
    'Receipt lines:',
    ...request.lines.map((line) => `- ${line}`),
    'Categories:',
    ...request.categories.map((name) => `- ${name}`),
  ].join('\n');
}

/** Names a shared receipt's payee with one forced tool call to the fast model. */
export function nameMerchant(
  config: DeepseekConfig,
  request: NameMerchantRequest,
): Promise<Generated<NameMerchantOutput>> {
  return generate(config, {
    tier: 'fast',
    system: nameMerchantSystem,
    prompt: nameMerchantPrompt(request),
    tool: { name: 'name_merchant', description: 'Who was paid, and the category it belongs in.' },
    schema: nameMerchantOutputSchema(request.categories),
    maxTokens: 120,
  });
}
