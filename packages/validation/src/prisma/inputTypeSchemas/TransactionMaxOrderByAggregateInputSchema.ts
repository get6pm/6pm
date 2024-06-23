import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const TransactionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default TransactionMaxOrderByAggregateInputSchema;
