import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutBudgetInputSchema } from './BudgetUserInvitationCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema } from './BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';

export const BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema;
