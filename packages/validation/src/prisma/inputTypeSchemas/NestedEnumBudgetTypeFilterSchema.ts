import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';

export const NestedEnumBudgetTypeFilterSchema: z.ZodType<Prisma.NestedEnumBudgetTypeFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeFilterSchema) ]).optional(),
}).strict();

export default NestedEnumBudgetTypeFilterSchema;
