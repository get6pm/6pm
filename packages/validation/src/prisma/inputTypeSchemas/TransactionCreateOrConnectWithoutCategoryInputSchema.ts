import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionCreateWithoutCategoryInputSchema } from './TransactionCreateWithoutCategoryInputSchema';
import { TransactionUncheckedCreateWithoutCategoryInputSchema } from './TransactionUncheckedCreateWithoutCategoryInputSchema';

export const TransactionCreateOrConnectWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export default TransactionCreateOrConnectWithoutCategoryInputSchema;
