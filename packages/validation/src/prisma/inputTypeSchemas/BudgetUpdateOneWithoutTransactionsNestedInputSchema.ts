import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutTransactionsInputSchema } from './BudgetCreateWithoutTransactionsInputSchema';
import { BudgetUncheckedCreateWithoutTransactionsInputSchema } from './BudgetUncheckedCreateWithoutTransactionsInputSchema';
import { BudgetCreateOrConnectWithoutTransactionsInputSchema } from './BudgetCreateOrConnectWithoutTransactionsInputSchema';
import { BudgetUpsertWithoutTransactionsInputSchema } from './BudgetUpsertWithoutTransactionsInputSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema } from './BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema';
import { BudgetUpdateWithoutTransactionsInputSchema } from './BudgetUpdateWithoutTransactionsInputSchema';
import { BudgetUncheckedUpdateWithoutTransactionsInputSchema } from './BudgetUncheckedUpdateWithoutTransactionsInputSchema';

export const BudgetUpdateOneWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutTransactionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export default BudgetUpdateOneWithoutTransactionsNestedInputSchema;
