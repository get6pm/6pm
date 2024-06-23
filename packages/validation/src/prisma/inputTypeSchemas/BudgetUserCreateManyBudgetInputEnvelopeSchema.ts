import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateManyBudgetInputSchema } from './BudgetUserCreateManyBudgetInputSchema';

export const BudgetUserCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserCreateManyBudgetInputSchema),z.lazy(() => BudgetUserCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default BudgetUserCreateManyBudgetInputEnvelopeSchema;
