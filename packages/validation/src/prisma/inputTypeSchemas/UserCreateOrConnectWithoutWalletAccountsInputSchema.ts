import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutWalletAccountsInputSchema } from './UserCreateWithoutWalletAccountsInputSchema';
import { UserUncheckedCreateWithoutWalletAccountsInputSchema } from './UserUncheckedCreateWithoutWalletAccountsInputSchema';

export const UserCreateOrConnectWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutWalletAccountsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutWalletAccountsInputSchema;
