import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutBudgetUsersInputSchema } from './UserUpdateWithoutBudgetUsersInputSchema';
import { UserUncheckedUpdateWithoutBudgetUsersInputSchema } from './UserUncheckedUpdateWithoutBudgetUsersInputSchema';
import { UserCreateWithoutBudgetUsersInputSchema } from './UserCreateWithoutBudgetUsersInputSchema';
import { UserUncheckedCreateWithoutBudgetUsersInputSchema } from './UserUncheckedCreateWithoutBudgetUsersInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUpsertWithoutBudgetUsersInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutBudgetUsersInputSchema;
