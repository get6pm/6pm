import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionCreateWithoutWalletAccountInputSchema } from './TransactionCreateWithoutWalletAccountInputSchema';
import { TransactionUncheckedCreateWithoutWalletAccountInputSchema } from './TransactionUncheckedCreateWithoutWalletAccountInputSchema';

export const TransactionCreateOrConnectWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema) ]),
}).strict();

export default TransactionCreateOrConnectWithoutWalletAccountInputSchema;
