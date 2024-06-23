import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema';
import { BudgetPeriodConfigUpsertWithoutBudgetInputSchema } from './BudgetPeriodConfigUpsertWithoutBudgetInputSchema';
import { BudgetPeriodConfigWhereInputSchema } from './BudgetPeriodConfigWhereInputSchema';
import { BudgetPeriodConfigWhereUniqueInputSchema } from './BudgetPeriodConfigWhereUniqueInputSchema';
import { BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInputSchema } from './BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInputSchema';
import { BudgetPeriodConfigUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUpdateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema';

export const BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).optional(),
  upsert: z.lazy(() => BudgetPeriodConfigUpsertWithoutBudgetInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetPeriodConfigWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetPeriodConfigWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema) ]).optional(),
}).strict();

export default BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInputSchema;
