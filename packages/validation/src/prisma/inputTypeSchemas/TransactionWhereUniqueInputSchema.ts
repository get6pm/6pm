import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { TransactionWhereInputSchema } from './TransactionWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { CategoryNullableRelationFilterSchema } from './CategoryNullableRelationFilterSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { BudgetNullableRelationFilterSchema } from './BudgetNullableRelationFilterSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { UserWalletAccountRelationFilterSchema } from './UserWalletAccountRelationFilterSchema';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const TransactionWhereUniqueInputSchema: z.ZodType<Prisma.TransactionWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TransactionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  note: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccountId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => CategoryNullableRelationFilterSchema),z.lazy(() => CategoryWhereInputSchema) ]).optional().nullable(),
  budget: z.union([ z.lazy(() => BudgetNullableRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional().nullable(),
  walletAccount: z.union([ z.lazy(() => UserWalletAccountRelationFilterSchema),z.lazy(() => UserWalletAccountWhereInputSchema) ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export default TransactionWhereUniqueInputSchema;
