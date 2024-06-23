import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutBudgetInputSchema } from './TransactionUpdateWithoutBudgetInputSchema';
import { TransactionUncheckedUpdateWithoutBudgetInputSchema } from './TransactionUncheckedUpdateWithoutBudgetInputSchema';

export const TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export default TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema;
