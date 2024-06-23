import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutWalletAccountInputSchema } from './TransactionUpdateWithoutWalletAccountInputSchema';
import { TransactionUncheckedUpdateWithoutWalletAccountInputSchema } from './TransactionUncheckedUpdateWithoutWalletAccountInputSchema';
import { TransactionCreateWithoutWalletAccountInputSchema } from './TransactionCreateWithoutWalletAccountInputSchema';
import { TransactionUncheckedCreateWithoutWalletAccountInputSchema } from './TransactionUncheckedCreateWithoutWalletAccountInputSchema';

export const TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutWalletAccountInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema) ]),
}).strict();

export default TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema;
