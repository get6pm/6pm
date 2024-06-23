import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigWhereInputSchema } from './BudgetPeriodConfigWhereInputSchema';

export const BudgetPeriodConfigNullableRelationFilterSchema: z.ZodType<Prisma.BudgetPeriodConfigNullableRelationFilter> = z.object({
  is: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional().nullable()
}).strict();

export default BudgetPeriodConfigNullableRelationFilterSchema;
