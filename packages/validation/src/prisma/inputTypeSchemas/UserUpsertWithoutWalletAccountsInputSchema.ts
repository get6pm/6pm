import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutWalletAccountsInputSchema } from './UserUpdateWithoutWalletAccountsInputSchema';
import { UserUncheckedUpdateWithoutWalletAccountsInputSchema } from './UserUncheckedUpdateWithoutWalletAccountsInputSchema';
import { UserCreateWithoutWalletAccountsInputSchema } from './UserCreateWithoutWalletAccountsInputSchema';
import { UserUncheckedCreateWithoutWalletAccountsInputSchema } from './UserUncheckedCreateWithoutWalletAccountsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutWalletAccountsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutWalletAccountsInputSchema;
