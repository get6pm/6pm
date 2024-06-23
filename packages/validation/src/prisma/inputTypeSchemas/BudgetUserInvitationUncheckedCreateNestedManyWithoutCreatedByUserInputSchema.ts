import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema } from './BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema';
import { BudgetUserInvitationWhereUniqueInputSchema } from './BudgetUserInvitationWhereUniqueInputSchema';

export const BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema;
