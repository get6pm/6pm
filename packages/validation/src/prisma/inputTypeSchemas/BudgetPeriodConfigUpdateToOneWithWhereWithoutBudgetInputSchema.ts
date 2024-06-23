import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigWhereInputSchema } from './BudgetPeriodConfigWhereInputSchema';
import { BudgetPeriodConfigUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUpdateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema';

export const BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetPeriodConfigUpdateToOneWithWhereWithoutBudgetInputSchema;
