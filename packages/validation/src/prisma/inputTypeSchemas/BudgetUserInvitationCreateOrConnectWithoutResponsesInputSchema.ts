import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';
import { BudgetUserInvitationCreateWithoutResponsesInputSchema } from './BudgetUserInvitationCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema';

export const BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutResponsesInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]),
}).strict();

export default BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema;
