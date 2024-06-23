import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutTransactionsInputSchema } from './UserUpdateWithoutTransactionsInputSchema';
import { UserUncheckedUpdateWithoutTransactionsInputSchema } from './UserUncheckedUpdateWithoutTransactionsInputSchema';
import { UserCreateWithoutTransactionsInputSchema } from './UserCreateWithoutTransactionsInputSchema';
import { UserUncheckedCreateWithoutTransactionsInputSchema } from './UserUncheckedCreateWithoutTransactionsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutTransactionsInputSchema;
