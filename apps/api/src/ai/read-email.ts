import { EMAIL_KINDS, type EmailModelReading } from '@6pm/domain';
import { z } from 'zod';

import { generate, type AnthropicConfig, type Generated } from './anthropic';

/**
 * Reads one email sent to a phone's receipt address: what kind of email it is and, for a payment,
 * what it prints. The model names things and copies the amount as printed; `emailSpendOf` checks
 * that text is in the email and turns it into an amount.
 */
export const emailModelOutputSchema = z.object({
  kind: z.enum(EMAIL_KINDS),
  amount: z.string().nullable(),
  currency: z.string().nullable(),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  at: z.string().nullable(),
  reference: z.string().nullable(),
  note: z.string().nullable(),
}) satisfies z.ZodType<EmailModelReading>;

export const readEmailSystem = `You read one email that a person's mail sent on to their money app, 6pm, and say whether it records money they just paid out. Most are from Vietnamese banks, wallets and shops; many are not about a payment at all. Fill every field.

kind:
- payment: money left the person's account, card or wallet to pay someone: a bank's debit or card alert, a shop, ride or food receipt, a bill paid, a transfer to another person.
- own_transfer: money moved between the person's own accounts: the sender and the receiver are the same name, a deposit or savings purchase, a currency exchange, a top-up of their own wallet.
- refund, incoming: money came in.
- failed: a payment that was declined, failed, cancelled or not charged ("Không thành công", "declined", "was not charged").
- order_update: about an order but not its payment: placed, shipped, delivered, cancelled, rate your order, a booking being processed.
- promo: marketing, offers, vouchers, prices of things not bought, newsletters.
- otp: a code or a sign-in link.
- statement: a statement, an invoice that is due, a balance summary.
- other: anything else.
When one email holds both an order and its payment, it is a payment.

For a payment, and null otherwise:
amount: the final amount actually paid, copied character for character as printed, with its symbol or code when it has one: "₫607,790", "158000₫", "(VND) 700,000.00", "99 USD". It is the total after vouchers, discounts and fees ("Tổng thanh toán", "Bạn trả", "Số tiền giao dịch", "Đã thanh toán hôm nay"), never a subtotal ("Tổng tiền", "Tổng tạm tính"), an item price or a limit. For a group order, the person's own share. Never work it out yourself.
currency: the ISO 4217 code of that amount (VND, USD, IDR).
merchant: who was really paid, as people say it: the restaurant or shop of a food or marketplace order ("Nhà Đậu", "meo.petshop"), "Grab" with the service for a ride ("Grab ride", "Grab tip"), the merchant of a card alert cleaned up ("Apple", "ElevenLabs", "Gloria Jean's Coffees"), the receiver's name for a transfer. Drop legal words (CÔNG TY, TNHH, CP, JSC, Pte Ltd, Inc). null when the email does not say.
category: what it was for, one of food, drinks, transport, groceries, shopping, fun, health, home, family, gifts. Rides, flights and hotels are transport; rent, utilities and building fees are home; apps and subscriptions are fun. null when unclear.
at: when it was paid, as printed, in the email's local time, written YYYY-MM-DDTHH:MM:SS. Dates are day first (16-10-2026). null when no time is printed.
reference: the order id or the bank's transaction reference, exactly as printed. null when there is none.
note: the transfer's own words ("Nội dung chuyển tiền"), exactly as printed. null when there are none.`;

/** One email is a short answer, but the model's own thinking counts against this too. */
export const readEmailMaxTokens = 1_536;
/** Email waits for nobody: the time only bounds a slow provider before the rules read it. */
export const readEmailTimeoutMs = 20_000;

/** Reads one email's text (`emailModelText`). A declined read fails as `model_unavailable`. */
export function readEmail(
  config: AnthropicConfig,
  text: string,
): Promise<Generated<EmailModelReading>> {
  return generate(config, {
    system: readEmailSystem,
    prompt: text,
    schema: emailModelOutputSchema,
    maxTokens: readEmailMaxTokens,
    timeoutMs: readEmailTimeoutMs,
  });
}
