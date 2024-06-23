import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutWalletAccountsInputSchema } from './UserUpdateWithoutWalletAccountsInputSchema';
import { UserUncheckedUpdateWithoutWalletAccountsInputSchema } from './UserUncheckedUpdateWithoutWalletAccountsInputSchema';

export const UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutWalletAccountsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema;
