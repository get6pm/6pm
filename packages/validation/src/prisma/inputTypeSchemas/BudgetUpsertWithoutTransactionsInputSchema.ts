import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUpdateWithoutTransactionsInputSchema } from './BudgetUpdateWithoutTransactionsInputSchema';
import { BudgetUncheckedUpdateWithoutTransactionsInputSchema } from './BudgetUncheckedUpdateWithoutTransactionsInputSchema';
import { BudgetCreateWithoutTransactionsInputSchema } from './BudgetCreateWithoutTransactionsInputSchema';
import { BudgetUncheckedCreateWithoutTransactionsInputSchema } from './BudgetUncheckedCreateWithoutTransactionsInputSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export default BudgetUpsertWithoutTransactionsInputSchema;
