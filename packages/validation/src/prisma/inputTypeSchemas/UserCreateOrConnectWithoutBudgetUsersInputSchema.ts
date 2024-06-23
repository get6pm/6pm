import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutBudgetUsersInputSchema } from './UserCreateWithoutBudgetUsersInputSchema';
import { UserUncheckedCreateWithoutBudgetUsersInputSchema } from './UserUncheckedCreateWithoutBudgetUsersInputSchema';

export const UserCreateOrConnectWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutBudgetUsersInputSchema;
