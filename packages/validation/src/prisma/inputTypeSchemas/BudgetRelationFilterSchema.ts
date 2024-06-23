import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetRelationFilterSchema: z.ZodType<Prisma.BudgetRelationFilter> = z.object({
  is: z.lazy(() => BudgetWhereInputSchema).optional(),
  isNot: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export default BudgetRelationFilterSchema;
