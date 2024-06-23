import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationScalarWhereInputSchema } from './BudgetUserInvitationScalarWhereInputSchema';
import { BudgetUserInvitationUpdateManyMutationInputSchema } from './BudgetUserInvitationUpdateManyMutationInputSchema';
import { BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInputSchema';

export const BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema;
