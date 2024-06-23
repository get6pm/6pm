import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema';
import { UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema } from './UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema';

export const UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema;
