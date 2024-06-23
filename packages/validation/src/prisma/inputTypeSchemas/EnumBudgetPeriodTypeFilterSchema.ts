import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';
import { NestedEnumBudgetPeriodTypeFilterSchema } from './NestedEnumBudgetPeriodTypeFilterSchema';

export const EnumBudgetPeriodTypeFilterSchema: z.ZodType<Prisma.EnumBudgetPeriodTypeFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema) ]).optional(),
}).strict();

export default EnumBudgetPeriodTypeFilterSchema;
