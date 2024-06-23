import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateManyCreatedByUserInputSchema } from './BudgetUserInvitationCreateManyCreatedByUserInputSchema';

export const BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyCreatedByUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema;
