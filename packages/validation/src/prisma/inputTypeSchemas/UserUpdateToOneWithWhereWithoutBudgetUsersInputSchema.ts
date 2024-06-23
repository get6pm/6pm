import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutBudgetUsersInputSchema } from './UserUpdateWithoutBudgetUsersInputSchema';
import { UserUncheckedUpdateWithoutBudgetUsersInputSchema } from './UserUncheckedUpdateWithoutBudgetUsersInputSchema';

export const UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema;
