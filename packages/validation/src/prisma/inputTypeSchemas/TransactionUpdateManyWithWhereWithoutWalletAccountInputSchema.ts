import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';
import { TransactionUpdateManyMutationInputSchema } from './TransactionUpdateManyMutationInputSchema';
import { TransactionUncheckedUpdateManyWithoutWalletAccountInputSchema } from './TransactionUncheckedUpdateManyWithoutWalletAccountInputSchema';

export const TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutWalletAccountInputSchema) ]),
}).strict();

export default TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema;
