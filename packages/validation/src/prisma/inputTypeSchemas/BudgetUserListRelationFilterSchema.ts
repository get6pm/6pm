import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereInputSchema } from './BudgetUserWhereInputSchema';

export const BudgetUserListRelationFilterSchema: z.ZodType<Prisma.BudgetUserListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserWhereInputSchema).optional()
}).strict();

export default BudgetUserListRelationFilterSchema;
