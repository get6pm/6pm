import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutBudgetUsersInputSchema } from './UserCreateWithoutBudgetUsersInputSchema';
import { UserUncheckedCreateWithoutBudgetUsersInputSchema } from './UserUncheckedCreateWithoutBudgetUsersInputSchema';
import { UserCreateOrConnectWithoutBudgetUsersInputSchema } from './UserCreateOrConnectWithoutBudgetUsersInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutBudgetUsersInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutBudgetUsersInputSchema;
