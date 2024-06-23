import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedBudgetUserInvitationsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema;
