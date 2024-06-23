import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from './BudgetUserInvitationResponseWhereUniqueInputSchema';
import { BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema';

export const BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema).optional(),
  upsert: z.lazy(() => BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]).optional(),
}).strict();

export default BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema;
