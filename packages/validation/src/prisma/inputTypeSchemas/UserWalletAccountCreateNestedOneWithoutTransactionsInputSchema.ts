import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateWithoutTransactionsInputSchema } from './UserWalletAccountCreateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema';
import { UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema } from './UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';

export const UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWalletAccountWhereUniqueInputSchema).optional()
}).strict();

export default UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema;
