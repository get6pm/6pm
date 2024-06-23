import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateManyCategoryInputSchema } from './TransactionCreateManyCategoryInputSchema';

export const TransactionCreateManyCategoryInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyCategoryInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyCategoryInputSchema),z.lazy(() => TransactionCreateManyCategoryInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default TransactionCreateManyCategoryInputEnvelopeSchema;
