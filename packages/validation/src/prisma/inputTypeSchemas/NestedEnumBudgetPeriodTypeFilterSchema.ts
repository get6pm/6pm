import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';

export const NestedEnumBudgetPeriodTypeFilterSchema: z.ZodType<Prisma.NestedEnumBudgetPeriodTypeFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema) ]).optional(),
}).strict();

export default NestedEnumBudgetPeriodTypeFilterSchema;
