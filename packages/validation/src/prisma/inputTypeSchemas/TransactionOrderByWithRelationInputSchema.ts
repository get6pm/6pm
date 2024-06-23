import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { CategoryOrderByWithRelationInputSchema } from './CategoryOrderByWithRelationInputSchema';
import { BudgetOrderByWithRelationInputSchema } from './BudgetOrderByWithRelationInputSchema';
import { UserWalletAccountOrderByWithRelationInputSchema } from './UserWalletAccountOrderByWithRelationInputSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';

export const TransactionOrderByWithRelationInputSchema: z.ZodType<Prisma.TransactionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  categoryId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => CategoryOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountOrderByWithRelationInputSchema).optional(),
  createdByUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export default TransactionOrderByWithRelationInputSchema;
