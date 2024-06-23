import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateWithoutTransactionsInputSchema } from './UserWalletAccountCreateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema';
import { UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema } from './UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema';
import { UserWalletAccountUpsertWithoutTransactionsInputSchema } from './UserWalletAccountUpsertWithoutTransactionsInputSchema';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema } from './UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema';
import { UserWalletAccountUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUpdateWithoutTransactionsInputSchema';
import { UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema } from './UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema';

export const UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => UserWalletAccountUpsertWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWalletAccountWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export default UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema;
