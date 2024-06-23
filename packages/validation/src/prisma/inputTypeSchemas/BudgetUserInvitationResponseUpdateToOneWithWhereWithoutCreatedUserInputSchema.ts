import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';
import { BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema';

export const BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema;
