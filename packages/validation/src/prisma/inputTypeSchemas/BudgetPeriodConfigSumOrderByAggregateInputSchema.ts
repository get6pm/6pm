import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetPeriodConfigSumOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigSumOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetPeriodConfigSumOrderByAggregateInputSchema;
