import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountCreateWithoutTransactionsInputSchema } from './UserWalletAccountCreateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema';

export const UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export default UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema;
