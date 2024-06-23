import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';

export const BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpsertWithoutCreatedUserInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]),
  where: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema;
