import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema';
import { BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema } from './BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';

export const BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema;
