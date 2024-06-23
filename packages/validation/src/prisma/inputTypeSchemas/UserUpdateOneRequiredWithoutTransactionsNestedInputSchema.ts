import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutTransactionsInputSchema } from './UserCreateWithoutTransactionsInputSchema';
import { UserUncheckedCreateWithoutTransactionsInputSchema } from './UserUncheckedCreateWithoutTransactionsInputSchema';
import { UserCreateOrConnectWithoutTransactionsInputSchema } from './UserCreateOrConnectWithoutTransactionsInputSchema';
import { UserUpsertWithoutTransactionsInputSchema } from './UserUpsertWithoutTransactionsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutTransactionsInputSchema } from './UserUpdateToOneWithWhereWithoutTransactionsInputSchema';
import { UserUpdateWithoutTransactionsInputSchema } from './UserUpdateWithoutTransactionsInputSchema';
import { UserUncheckedUpdateWithoutTransactionsInputSchema } from './UserUncheckedUpdateWithoutTransactionsInputSchema';

export const UserUpdateOneRequiredWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutTransactionsNestedInputSchema;
