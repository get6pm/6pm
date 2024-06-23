import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetNullableRelationFilterSchema: z.ZodType<Prisma.BudgetNullableRelationFilter> = z.object({
  is: z.lazy(() => BudgetWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => BudgetWhereInputSchema).optional().nullable()
}).strict();

export default BudgetNullableRelationFilterSchema;
