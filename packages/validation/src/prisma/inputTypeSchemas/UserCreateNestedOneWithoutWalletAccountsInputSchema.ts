import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutWalletAccountsInputSchema } from './UserCreateWithoutWalletAccountsInputSchema';
import { UserUncheckedCreateWithoutWalletAccountsInputSchema } from './UserUncheckedCreateWithoutWalletAccountsInputSchema';
import { UserCreateOrConnectWithoutWalletAccountsInputSchema } from './UserCreateOrConnectWithoutWalletAccountsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutWalletAccountsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutWalletAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutWalletAccountsInputSchema;
