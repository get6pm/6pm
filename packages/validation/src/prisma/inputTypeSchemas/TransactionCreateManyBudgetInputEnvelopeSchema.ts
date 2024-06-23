import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateManyBudgetInputSchema } from './TransactionCreateManyBudgetInputSchema';

export const TransactionCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyBudgetInputSchema),z.lazy(() => TransactionCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default TransactionCreateManyBudgetInputEnvelopeSchema;
