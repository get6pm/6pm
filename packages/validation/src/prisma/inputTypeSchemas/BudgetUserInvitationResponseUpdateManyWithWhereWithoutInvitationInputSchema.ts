import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseScalarWhereInputSchema } from './BudgetUserInvitationResponseScalarWhereInputSchema';
import { BudgetUserInvitationResponseUpdateManyMutationInputSchema } from './BudgetUserInvitationResponseUpdateManyMutationInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInputSchema';

export const BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema;
