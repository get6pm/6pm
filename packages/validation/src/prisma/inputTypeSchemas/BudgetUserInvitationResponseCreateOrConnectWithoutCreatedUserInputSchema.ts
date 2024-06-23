import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema';

export const BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema;
