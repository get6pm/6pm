import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { BudgetCreateNestedOneWithoutTransactionsInputSchema } from './BudgetCreateNestedOneWithoutTransactionsInputSchema';
import { UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema } from './UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema';
import { UserCreateNestedOneWithoutTransactionsInputSchema } from './UserCreateNestedOneWithoutTransactionsInputSchema';

export const TransactionCreateWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionCreateWithoutCategoryInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export default TransactionCreateWithoutCategoryInputSchema;
