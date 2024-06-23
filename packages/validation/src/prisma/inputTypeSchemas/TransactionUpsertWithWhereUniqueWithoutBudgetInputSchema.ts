import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutBudgetInputSchema } from './TransactionUpdateWithoutBudgetInputSchema';
import { TransactionUncheckedUpdateWithoutBudgetInputSchema } from './TransactionUncheckedUpdateWithoutBudgetInputSchema';
import { TransactionCreateWithoutBudgetInputSchema } from './TransactionCreateWithoutBudgetInputSchema';
import { TransactionUncheckedCreateWithoutBudgetInputSchema } from './TransactionUncheckedCreateWithoutBudgetInputSchema';

export const TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema;
