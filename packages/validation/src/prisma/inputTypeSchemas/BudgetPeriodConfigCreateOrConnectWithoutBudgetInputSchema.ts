import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigWhereUniqueInputSchema } from './BudgetPeriodConfigWhereUniqueInputSchema';
import { BudgetPeriodConfigCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema';

export const BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema;
