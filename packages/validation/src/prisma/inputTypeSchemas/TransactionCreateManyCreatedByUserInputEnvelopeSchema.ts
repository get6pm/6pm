import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateManyCreatedByUserInputSchema } from './TransactionCreateManyCreatedByUserInputSchema';

export const TransactionCreateManyCreatedByUserInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyCreatedByUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyCreatedByUserInputSchema),z.lazy(() => TransactionCreateManyCreatedByUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default TransactionCreateManyCreatedByUserInputEnvelopeSchema;
