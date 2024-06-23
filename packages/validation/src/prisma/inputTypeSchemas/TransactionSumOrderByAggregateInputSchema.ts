import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const TransactionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionSumOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default TransactionSumOrderByAggregateInputSchema;
