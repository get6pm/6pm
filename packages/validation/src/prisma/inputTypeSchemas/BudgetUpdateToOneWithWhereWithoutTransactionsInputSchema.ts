import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUpdateWithoutTransactionsInputSchema } from './BudgetUpdateWithoutTransactionsInputSchema';
import { BudgetUncheckedUpdateWithoutTransactionsInputSchema } from './BudgetUncheckedUpdateWithoutTransactionsInputSchema';

export const BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export default BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema;
