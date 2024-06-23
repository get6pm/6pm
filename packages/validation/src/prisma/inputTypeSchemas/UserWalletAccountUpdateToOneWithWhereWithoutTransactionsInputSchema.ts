import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';
import { UserWalletAccountUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUpdateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema';

export const UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export default UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema;
