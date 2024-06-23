import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseCreateManyInvitationInputSchema } from './BudgetUserInvitationResponseCreateManyInvitationInputSchema';

export const BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyInvitationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema;
