import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereInputSchema } from './TransactionWhereInputSchema';

export const TransactionListRelationFilterSchema: z.ZodType<Prisma.TransactionListRelationFilter> = z.object({
  every: z.lazy(() => TransactionWhereInputSchema).optional(),
  some: z.lazy(() => TransactionWhereInputSchema).optional(),
  none: z.lazy(() => TransactionWhereInputSchema).optional()
}).strict();

export default TransactionListRelationFilterSchema;
