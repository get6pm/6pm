import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutTransactionsInputSchema } from './BudgetCreateWithoutTransactionsInputSchema';
import { BudgetUncheckedCreateWithoutTransactionsInputSchema } from './BudgetUncheckedCreateWithoutTransactionsInputSchema';
import { BudgetCreateOrConnectWithoutTransactionsInputSchema } from './BudgetCreateOrConnectWithoutTransactionsInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';

export const BudgetCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export default BudgetCreateNestedOneWithoutTransactionsInputSchema;
