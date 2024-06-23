import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema;
