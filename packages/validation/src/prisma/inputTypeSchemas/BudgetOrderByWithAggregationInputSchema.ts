import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetCountOrderByAggregateInputSchema } from './BudgetCountOrderByAggregateInputSchema';
import { BudgetMaxOrderByAggregateInputSchema } from './BudgetMaxOrderByAggregateInputSchema';
import { BudgetMinOrderByAggregateInputSchema } from './BudgetMinOrderByAggregateInputSchema';

export const BudgetOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetMinOrderByAggregateInputSchema).optional()
}).strict();

export default BudgetOrderByWithAggregationInputSchema;
