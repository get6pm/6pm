import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserOrderByRelationAggregateInputSchema;
