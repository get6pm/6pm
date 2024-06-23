import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema';

export const UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema;
