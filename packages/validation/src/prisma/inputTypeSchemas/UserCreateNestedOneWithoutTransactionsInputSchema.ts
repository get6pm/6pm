import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutTransactionsInputSchema } from './UserCreateWithoutTransactionsInputSchema';
import { UserUncheckedCreateWithoutTransactionsInputSchema } from './UserUncheckedCreateWithoutTransactionsInputSchema';
import { UserCreateOrConnectWithoutTransactionsInputSchema } from './UserCreateOrConnectWithoutTransactionsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutTransactionsInputSchema;
