import {
  currencyCodeSchema,
  receiptMinorUnits,
  receiptReadingSchema,
  type ReceiptReading,
  type ReceiptReadRequest,
} from '@6pm/domain';
import { z } from 'zod';

import { readImage, type AnthropicConfig, type ImageRead, type VisionModel } from './anthropic';

/**
 * One receipt is a short answer, but the model's own thinking counts against this too, and running
 * out wastes the whole call. The time budget covers a slow image upload.
 */
export const receiptReadMaxTokens = 1_536;
export const receiptReadTimeoutMs = 20_000;

/**
 * What the model says about the photo. It names things and copies the total as printed; code
 * turns that text into an amount, so the model never does arithmetic on money.
 */
export const receiptModelOutputSchema = z.object({
  isReceipt: z.boolean(),
  total: z.string().nullable(),
  currency: z.string().nullable(),
  merchant: z.string().nullable(),
  at: z.string().nullable(),
  sure: z.boolean(),
});
export type ReceiptModelOutput = z.infer<typeof receiptModelOutputSchema>;

export const receiptReadSystem = `You read one photo that a person shared to their money app, 6pm: a shop receipt, a bill, an invoice, or a payment confirmation from a bank, wallet or delivery app. You say what they paid. Fill every field.

isReceipt: false when the photo is none of those things. Then every other field is null and sure is false.

total: the total actually paid, copied exactly as printed: its digits with the separators as they appear ("101.500", "68.80", "1,250,000"), without a currency symbol or code. It is the final amount after discounts, vouchers and promotions, including tax, service charge and delivery. It is never the subtotal, a tax or service line, the cash tendered, or the change. A payment confirmation's single amount is its total. Copy the number printed against the final total's label ("Total", "Tổng cộng", "Tổng thanh toán", "Total Jumlah Pembayaran") even when it differs from the items or the subtotal added up: never work it out yourself. null when no total can be read.

currency: the ISO 4217 code of the total ("VND", "SGD", "USD"). Take it from a currency symbol or code on the receipt. When there is none, or the symbol is shared by several currencies ("$", "¥", "kr"), decide from the country the receipt is from: the address, the tax registration (MST or Mã số thuế: Vietnam; GST with a UEN: Singapore; SST: Malaysia; VAT with TIN: the Philippines; ABN: Australia), the phone number format, the language. Use the hint you are given only when the receipt itself cannot decide.

merchant: the shop's own name, the way people say it ("The Coffee Bean & Tea Leaf", "Cơm Gà Hải Nam", "Highlands Coffee"). Not the platform, point-of-sale or payment app that printed it (Grab, ShopeeFood, MoMo, Square, KiotViet), unless no other name is given. Drop legal words (Công ty, TNHH, Pte Ltd, Sdn Bhd, Co., Ltd). Never guess a name that is not printed: null when the receipt does not say who was paid.

at: when the purchase was made, as printed, in the receipt's local time, written YYYY-MM-DDTHH:MM:SS. Dates are day first (29/08/2026) unless the receipt is from the United States. When it prints a time in and a time out or printed, use the later one: that is when they paid. null when the date or the time is not printed.

sure: true only when the total and its currency are clearly legible and there is no doubt which amount is the total paid. false when digits are blurred or cut off, when several amounts could be the total, or when the currency rests on the hint.`;

const languageNames = { en: 'English', vi: 'Vietnamese' } as const;

/** The text after the photo: the hint, and the person's language for names with two forms. */
export function receiptReadPrompt(request: Pick<ReceiptReadRequest, 'language' | 'currencyHint'>) {
  return [
    `Currency hint: ${request.currencyHint ?? 'none'}`,
    `The person reads ${languageNames[request.language]}; when the shop's name is printed in two languages, use that one.`,
    'Read the receipt.',
  ].join('\n');
}

const printedLocalTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

/**
 * The model's words as the wire reading. The currency is the model's, else the hint, else đồng
 * (6pm's home currency) and not sure. No total that reads as a positive amount means no reading.
 */
export function toReceiptReading(
  output: ReceiptModelOutput,
  currencyHint: string | null,
): ReceiptReading | null {
  if (!output.isReceipt || output.total === null) return null;
  const named = currencyCodeSchema.safeParse(output.currency?.trim().toUpperCase());
  const currency = named.success ? named.data : (currencyHint ?? 'VND');
  const amount = receiptMinorUnits(output.total, currency);
  if (amount === null) return null;
  const merchant = output.merchant?.trim().slice(0, 120) ?? '';
  const at = output.at?.trim() ?? '';
  const reading = receiptReadingSchema.safeParse({
    amount,
    currency,
    merchant: merchant === '' ? null : merchant,
    at: printedLocalTime.test(at) && !Number.isNaN(Date.parse(at)) ? at : null,
    sure: output.sure && named.success,
  });
  return reading.success ? reading.data : null;
}

/** Reads one receipt photo with the vision model. A declined read is no reading. */
export async function readReceipt(
  config: AnthropicConfig,
  request: ReceiptReadRequest,
  model?: VisionModel,
): Promise<ImageRead<ReceiptReading>> {
  const read = await readImage(config, {
    system: receiptReadSystem,
    image: request.image,
    prompt: receiptReadPrompt(request),
    schema: receiptModelOutputSchema,
    maxTokens: receiptReadMaxTokens,
    timeoutMs: receiptReadTimeoutMs,
    ...(model === undefined ? {} : { model }),
  });
  return {
    ...read,
    output: read.output === null ? null : toReceiptReading(read.output, request.currencyHint),
  };
}
