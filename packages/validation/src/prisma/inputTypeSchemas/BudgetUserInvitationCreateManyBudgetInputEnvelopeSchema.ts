import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateManyBudgetInputSchema } from './BudgetUserInvitationCreateManyBudgetInputSchema';

export const BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationCreateManyBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema;
