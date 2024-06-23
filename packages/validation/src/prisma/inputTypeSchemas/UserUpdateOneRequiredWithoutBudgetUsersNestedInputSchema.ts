import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutBudgetUsersInputSchema } from './UserCreateWithoutBudgetUsersInputSchema';
import { UserUncheckedCreateWithoutBudgetUsersInputSchema } from './UserUncheckedCreateWithoutBudgetUsersInputSchema';
import { UserCreateOrConnectWithoutBudgetUsersInputSchema } from './UserCreateOrConnectWithoutBudgetUsersInputSchema';
import { UserUpsertWithoutBudgetUsersInputSchema } from './UserUpsertWithoutBudgetUsersInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema } from './UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema';
import { UserUpdateWithoutBudgetUsersInputSchema } from './UserUpdateWithoutBudgetUsersInputSchema';
import { UserUncheckedUpdateWithoutBudgetUsersInputSchema } from './UserUncheckedUpdateWithoutBudgetUsersInputSchema';

export const UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutBudgetUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema),z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema;
