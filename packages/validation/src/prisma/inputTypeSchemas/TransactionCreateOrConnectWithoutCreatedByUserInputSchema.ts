import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionCreateWithoutCreatedByUserInputSchema } from './TransactionCreateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedCreateWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateWithoutCreatedByUserInputSchema';

export const TransactionCreateOrConnectWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default TransactionCreateOrConnectWithoutCreatedByUserInputSchema;
