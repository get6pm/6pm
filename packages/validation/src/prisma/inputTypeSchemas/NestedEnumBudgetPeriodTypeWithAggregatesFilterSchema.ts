import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumBudgetPeriodTypeFilterSchema } from './NestedEnumBudgetPeriodTypeFilterSchema';

export const NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetPeriodTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional()
}).strict();

export default NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema;
