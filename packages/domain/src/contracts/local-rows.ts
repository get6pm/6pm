import { z } from 'zod';

/** Rows of the phone's money database, checked on every read and write. */

const id = z.string().min(1);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const instant = z.string().min(20);
const vnd = z.number().int().nonnegative();

export const spendSourceSchema = z.enum([
  'manual',
  'voice',
  'shared',
  'qr',
  'email',
  'applePay',
  'cash',
]);
export const spendStatusSchema = z.enum(['caught', 'pending', 'kept', 'skipped', 'deleted']);

export const categoryRowSchema = z.object({
  id,
  name: z.string().min(1),
  icon: z.string().min(1),
  hue: z.number(),
  countsDaily: z.boolean(),
  sort: z.number().int(),
  archivedAt: instant.nullable(),
});
export type CategoryRow = z.infer<typeof categoryRowSchema>;

export const foreignAmountSchema = z.object({
  currency: z.string().length(3),
  amount: z.number().nonnegative(),
  /** Đồng for one unit; 0 while a captured foreign amount waits for a rate. */
  rate: z.number().nonnegative(),
});

export const spendRowSchema = z.object({
  id,
  day,
  at: instant,
  amount: vnd,
  categoryId: id,
  merchant: z.string(),
  note: z.string().nullable(),
  source: spendSourceSchema,
  status: spendStatusSchema,
  previousStatus: spendStatusSchema.nullable(),
  wallet: z.string().nullable(),
  forWork: z.boolean(),
  detail: z.string().nullable(),
  foreignAmount: foreignAmountSchema.nullable(),
  /**
   * The receipt printed no currency and the one saved was guessed; absent on rows and backups
   * from before it was kept.
   */
  currencyGuessed: z.boolean().optional(),
  /**
   * The bill this payment paid (its id), or `'repayment'` for a card or loan with no bill: out of
   * the daily number, since the bill already came off the plan. Absent on rows and backups from
   * before bills could be paid by a spend.
   */
  paysBill: z.string().min(1).nullable().optional(),
  createdAt: instant,
  updatedAt: instant,
});
export type SpendRow = z.infer<typeof spendRowSchema>;

export const merchantRuleRowSchema = z.object({
  merchantKey: z.string().min(1),
  merchant: z.string().min(1),
  categoryId: id,
  learnedTimes: z.number().int().nonnegative(),
  setByUser: z.boolean(),
});
export type MerchantRuleRow = z.infer<typeof merchantRuleRowSchema>;

const month = z.string().regex(/^\d{4}-\d{2}$/);

export const billKindSchema = z.enum(['card', 'other']);

/** Kind, last month, paid amount and asked cycle arrived with snapshot format 4. */
export const billRowSchema = z.object({
  id,
  name: z.string().min(1),
  icon: z.string().min(1),
  hue: z.number(),
  amount: vnd,
  dueDay: z.number().int().min(1).max(31),
  paidCycle: day.nullable(),
  sort: z.number().int(),
  archivedAt: instant.nullable(),
  /** A card bill's payment never moves free money (card spending counted when it happened). */
  kind: billKindSchema.default('other'),
  /** The last month ('YYYY-MM') it is paid in; it stops by itself after. Null: no end. */
  lastMonth: month.nullable().default(null),
  /** What paying it took in `paidCycle`, when that was not its amount (`other` bills only). */
  paidAmount: vnd.nullable().default(null),
  /** The pay cycle the close last asked whether a capture paid it: once a cycle at most. */
  askedCycle: day.nullable().default(null),
});
export type BillRow = z.infer<typeof billRowSchema>;

export const potRowSchema = z.object({
  id,
  kind: z.enum(['goal', 'occasion']),
  name: z.string().min(1),
  icon: z.string().min(1),
  hue: z.number(),
  goal: vnd,
  neededBy: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable(),
  share: z.number().min(0).max(1).nullable(),
  paused: z.boolean(),
  createdAt: instant,
  archivedAt: instant.nullable(),
});
export type PotRow = z.infer<typeof potRowSchema>;

export const closedDayRowSchema = z.object({
  day,
  closedAt: instant,
  late: z.boolean(),
  spent: vnd,
  line: z.number().int(),
  tomorrow: vnd,
  note: z.string().nullable(),
});
export type ClosedDayRow = z.infer<typeof closedDayRowSchema>;
