import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumBudgetTypeFilterSchema } from './NestedEnumBudgetTypeFilterSchema';

export const NestedEnumBudgetTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional()
}).strict();

export default NestedEnumBudgetTypeWithAggregatesFilterSchema;
