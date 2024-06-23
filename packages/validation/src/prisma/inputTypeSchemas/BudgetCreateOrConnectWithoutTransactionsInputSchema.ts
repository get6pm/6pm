import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetCreateWithoutTransactionsInputSchema } from './BudgetCreateWithoutTransactionsInputSchema';
import { BudgetUncheckedCreateWithoutTransactionsInputSchema } from './BudgetUncheckedCreateWithoutTransactionsInputSchema';

export const BudgetCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export default BudgetCreateOrConnectWithoutTransactionsInputSchema;
