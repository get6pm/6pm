import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetPeriodConfigCountOrderByAggregateInputSchema } from './BudgetPeriodConfigCountOrderByAggregateInputSchema';
import { BudgetPeriodConfigAvgOrderByAggregateInputSchema } from './BudgetPeriodConfigAvgOrderByAggregateInputSchema';
import { BudgetPeriodConfigMaxOrderByAggregateInputSchema } from './BudgetPeriodConfigMaxOrderByAggregateInputSchema';
import { BudgetPeriodConfigMinOrderByAggregateInputSchema } from './BudgetPeriodConfigMinOrderByAggregateInputSchema';
import { BudgetPeriodConfigSumOrderByAggregateInputSchema } from './BudgetPeriodConfigSumOrderByAggregateInputSchema';

export const BudgetPeriodConfigOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetPeriodConfigOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetPeriodConfigCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => BudgetPeriodConfigAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetPeriodConfigMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetPeriodConfigMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => BudgetPeriodConfigSumOrderByAggregateInputSchema).optional()
}).strict();

export default BudgetPeriodConfigOrderByWithAggregationInputSchema;
