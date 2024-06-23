import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutWalletAccountInputSchema } from './TransactionUpdateWithoutWalletAccountInputSchema';
import { TransactionUncheckedUpdateWithoutWalletAccountInputSchema } from './TransactionUncheckedUpdateWithoutWalletAccountInputSchema';

export const TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutWalletAccountInputSchema) ]),
}).strict();

export default TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema;
