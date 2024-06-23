import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutResponsesInputSchema } from './BudgetUserInvitationCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';

export const BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateNestedOneWithoutResponsesInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).optional()
}).strict();

export default BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema;
