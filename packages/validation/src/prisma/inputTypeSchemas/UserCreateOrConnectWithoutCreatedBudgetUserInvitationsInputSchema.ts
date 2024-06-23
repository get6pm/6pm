import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema';

export const UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema;
