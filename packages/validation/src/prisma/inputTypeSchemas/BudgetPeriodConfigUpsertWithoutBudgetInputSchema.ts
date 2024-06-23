import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUpdateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema';
import { BudgetPeriodConfigCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigWhereInputSchema } from './BudgetPeriodConfigWhereInputSchema';

export const BudgetPeriodConfigUpsertWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpsertWithoutBudgetInput> = z.object({
  update: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]),
  where: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional()
}).strict();

export default BudgetPeriodConfigUpsertWithoutBudgetInputSchema;
