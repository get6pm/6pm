import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { BudgetUserCountOrderByAggregateInputSchema } from './BudgetUserCountOrderByAggregateInputSchema';
import { BudgetUserMaxOrderByAggregateInputSchema } from './BudgetUserMaxOrderByAggregateInputSchema';
import { BudgetUserMinOrderByAggregateInputSchema } from './BudgetUserMinOrderByAggregateInputSchema';

export const BudgetUserOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetUserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserMinOrderByAggregateInputSchema).optional()
}).strict();

export default BudgetUserOrderByWithAggregationInputSchema;
