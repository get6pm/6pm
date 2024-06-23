import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationScalarWhereInputSchema } from './BudgetUserInvitationScalarWhereInputSchema';
import { BudgetUserInvitationUpdateManyMutationInputSchema } from './BudgetUserInvitationUpdateManyMutationInputSchema';
import { BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInputSchema';

export const BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema;
