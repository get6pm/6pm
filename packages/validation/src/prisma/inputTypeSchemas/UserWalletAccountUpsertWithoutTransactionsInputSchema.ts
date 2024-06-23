import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUpdateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema';
import { UserWalletAccountCreateWithoutTransactionsInputSchema } from './UserWalletAccountCreateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';

export const UserWalletAccountUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export default UserWalletAccountUpsertWithoutTransactionsInputSchema;
