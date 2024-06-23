import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetOrderByWithRelationInputSchema } from './BudgetOrderByWithRelationInputSchema';

export const BudgetPeriodConfigOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetPeriodConfigOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional()
}).strict();

export default BudgetPeriodConfigOrderByWithRelationInputSchema;
