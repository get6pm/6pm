import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const TransactionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionAvgOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default TransactionAvgOrderByAggregateInputSchema;
