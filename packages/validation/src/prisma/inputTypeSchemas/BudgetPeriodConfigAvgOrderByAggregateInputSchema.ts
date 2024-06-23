import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetPeriodConfigAvgOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigAvgOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetPeriodConfigAvgOrderByAggregateInputSchema;
