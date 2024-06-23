import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';

export const TransactionCreateManyCategoryInputSchema: z.ZodType<Prisma.TransactionCreateManyCategoryInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export default TransactionCreateManyCategoryInputSchema;
