import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserMaxOrderByAggregateInputSchema;
