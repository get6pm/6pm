import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateManyWalletAccountInputSchema } from './TransactionCreateManyWalletAccountInputSchema';

export const TransactionCreateManyWalletAccountInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyWalletAccountInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyWalletAccountInputSchema),z.lazy(() => TransactionCreateManyWalletAccountInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default TransactionCreateManyWalletAccountInputEnvelopeSchema;
