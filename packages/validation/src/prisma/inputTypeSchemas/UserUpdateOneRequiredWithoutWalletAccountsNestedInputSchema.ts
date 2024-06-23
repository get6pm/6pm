import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutWalletAccountsInputSchema } from './UserCreateWithoutWalletAccountsInputSchema';
import { UserUncheckedCreateWithoutWalletAccountsInputSchema } from './UserUncheckedCreateWithoutWalletAccountsInputSchema';
import { UserCreateOrConnectWithoutWalletAccountsInputSchema } from './UserCreateOrConnectWithoutWalletAccountsInputSchema';
import { UserUpsertWithoutWalletAccountsInputSchema } from './UserUpsertWithoutWalletAccountsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema } from './UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema';
import { UserUpdateWithoutWalletAccountsInputSchema } from './UserUpdateWithoutWalletAccountsInputSchema';
import { UserUncheckedUpdateWithoutWalletAccountsInputSchema } from './UserUncheckedUpdateWithoutWalletAccountsInputSchema';

export const UserUpdateOneRequiredWithoutWalletAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutWalletAccountsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutWalletAccountsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutWalletAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema),z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutWalletAccountsNestedInputSchema;
