import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionCreateWithoutBudgetInputSchema } from './TransactionCreateWithoutBudgetInputSchema';
import { TransactionUncheckedCreateWithoutBudgetInputSchema } from './TransactionUncheckedCreateWithoutBudgetInputSchema';

export const TransactionCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default TransactionCreateOrConnectWithoutBudgetInputSchema;
