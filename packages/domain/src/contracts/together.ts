import { z } from 'zod';

import { MAX_SHARED_AMOUNT } from '../together/shared-pots';

/**
 * Budget together: two people, signed in with Apple, keep one or more pots they both add to. The
 * server holds the shared copy; leaving deletes it, and each phone keeps what its own person put
 * in as history.
 */

/** Ids the phone makes (a pot or a contribution), so a write can be retried and shown at once. */
export const togetherIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

/**
 * Whole minor units of the pot's currency (đồng, cents, yen), more than nothing, and never past
 * what a pot can hold.
 */
export const sharedAmountSchema = z.number().int().positive().max(MAX_SHARED_AMOUNT);

/**
 * A pot's currency, ISO 4217 upper case. Fixed when the pot is made: its maker's home currency.
 * A phone that sends none, or a pot kept before pots had one, is in đồng.
 */
export const sharedCurrencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .default('VND');

/** An invite code: 22 URL-safe characters (16 random bytes). */
export const inviteCodePattern = /^[A-Za-z0-9_-]{22}$/;

/** A given name as Apple hands it over the first time, trimmed; nothing else is asked for. */
export const memberNameSchema = z.string().trim().min(1).max(40);

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const sharedPotFieldsSchema = z.strictObject({
  name: z.string().trim().min(1).max(40),
  /** A Material Symbols name. */
  icon: z.string().regex(/^[a-z0-9_]{1,40}$/),
  hue: z.number().int().min(0).max(359),
  goal: sharedAmountSchema,
  /** The month the pot is needed by, or null for no date. */
  neededBy: yearMonth.nullable(),
});
export type SharedPotFields = z.infer<typeof sharedPotFieldsSchema>;

export const createSharedPotRequestSchema = sharedPotFieldsSchema.extend({
  id: togetherIdSchema,
  currency: sharedCurrencySchema,
});
/** An edit never changes the currency: every amount already in the pot is counted in it. */
export const editSharedPotRequestSchema = sharedPotFieldsSchema;

export const addContributionRequestSchema = z.strictObject({
  id: togetherIdSchema,
  amount: sharedAmountSchema,
});

/** A sign-in nonce the server hands out: 32 URL-safe characters or more. */
export const signInNoncePattern = /^[A-Za-z0-9_-]{32,128}$/;

export const signInNonceResponseSchema = z.object({
  nonce: z.string().regex(signInNoncePattern),
});

export const appleSignInRequestSchema = z.strictObject({
  /** The identity token (a JWT signed by Apple). */
  identityToken: z.string().min(20).max(4096),
  /** The raw nonce from `POST /v1/together/nonce`; the token carries its SHA-256. */
  nonce: z.string().regex(signInNoncePattern),
  /** The one-time code Apple gives with it, exchanged on the server so access can be revoked. */
  authorizationCode: z.string().min(1).max(512).optional(),
  /** Apple sends the name only the first time someone signs in to the app. */
  name: memberNameSchema.optional(),
});

export const sharedContributionSchema = z.object({
  id: togetherIdSchema,
  memberId: z.string(),
  amount: sharedAmountSchema,
  addedAt: z.string(),
});
export type SharedContribution = z.infer<typeof sharedContributionSchema>;

export const sharedPotSchema = sharedPotFieldsSchema.extend({
  id: togetherIdSchema,
  currency: sharedCurrencySchema,
  createdBy: z.string(),
  createdAt: z.string(),
  contributions: z.array(sharedContributionSchema),
});
export type SharedPot = z.infer<typeof sharedPotSchema>;

export const togetherMemberSchema = z.object({
  id: z.string(),
  /** Null when Apple never gave a name; the phone shows "You" or "Partner". */
  name: z.string().nullable(),
});
export type TogetherMember = z.infer<typeof togetherMemberSchema>;

export const togetherPairSchema = z.object({
  id: z.string(),
  /** One or two people; the one asking is among them. */
  members: z.array(togetherMemberSchema).min(1).max(2),
  pots: z.array(sharedPotSchema),
});
export type TogetherPair = z.infer<typeof togetherPairSchema>;

/** What `GET /v1/together` and every write answer: the whole shared copy, as the server has it. */
export const togetherStateSchema = z.object({
  /** Null when this phone is not signed in with Apple. */
  me: togetherMemberSchema.nullable(),
  pair: togetherPairSchema.nullable(),
});
export type TogetherState = z.infer<typeof togetherStateSchema>;

export const createInviteResponseSchema = z.object({
  code: z.string().regex(inviteCodePattern),
  expiresAt: z.string(),
});

export const leaveResponseSchema = z.object({ left: z.literal(true) });
export const deleteTogetherAccountResponseSchema = z.object({ deleted: z.literal(true) });

/** Why an invite cannot be taken, in the error's `detail.reason`. */
export const inviteRefusalSchema = z.enum(['expired', 'used', 'full', 'own', 'paired']);
export type InviteRefusal = z.infer<typeof inviteRefusalSchema>;
