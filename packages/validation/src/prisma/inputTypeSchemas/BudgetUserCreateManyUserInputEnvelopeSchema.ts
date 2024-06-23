import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateManyUserInputSchema } from './BudgetUserCreateManyUserInputSchema';

export const BudgetUserCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserCreateManyUserInputSchema),z.lazy(() => BudgetUserCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default BudgetUserCreateManyUserInputEnvelopeSchema;
