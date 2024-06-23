import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { NestedEnumBudgetTypeWithAggregatesFilterSchema } from './NestedEnumBudgetTypeWithAggregatesFilterSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumBudgetTypeFilterSchema } from './NestedEnumBudgetTypeFilterSchema';

export const EnumBudgetTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumBudgetTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional()
}).strict();

export default EnumBudgetTypeWithAggregatesFilterSchema;
