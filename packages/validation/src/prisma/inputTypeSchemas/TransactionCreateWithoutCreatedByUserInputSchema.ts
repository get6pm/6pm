import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { CategoryCreateNestedOneWithoutTransactionsInputSchema } from './CategoryCreateNestedOneWithoutTransactionsInputSchema';
import { BudgetCreateNestedOneWithoutTransactionsInputSchema } from './BudgetCreateNestedOneWithoutTransactionsInputSchema';
import { UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema } from './UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema';

export const TransactionCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutTransactionsInputSchema).optional(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export default TransactionCreateWithoutCreatedByUserInputSchema;
