import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema';

export const BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema;
