import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutTransactionsInputSchema } from './UserCreateWithoutTransactionsInputSchema';
import { UserUncheckedCreateWithoutTransactionsInputSchema } from './UserUncheckedCreateWithoutTransactionsInputSchema';

export const UserCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutTransactionsInputSchema;
