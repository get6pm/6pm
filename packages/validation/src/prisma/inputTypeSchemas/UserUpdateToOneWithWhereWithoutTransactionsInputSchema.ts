import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutTransactionsInputSchema } from './UserUpdateWithoutTransactionsInputSchema';
import { UserUncheckedUpdateWithoutTransactionsInputSchema } from './UserUncheckedUpdateWithoutTransactionsInputSchema';

export const UserUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutTransactionsInputSchema;
