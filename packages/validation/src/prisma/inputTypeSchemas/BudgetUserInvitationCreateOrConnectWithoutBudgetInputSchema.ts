import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationCreateWithoutBudgetInputSchema } from './BudgetUserInvitationCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema';

export const BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema;
