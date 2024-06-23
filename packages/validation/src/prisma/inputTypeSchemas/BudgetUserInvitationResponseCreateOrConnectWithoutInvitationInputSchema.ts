import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema';

export const BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema) ]),
}).strict();

export default BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema;
