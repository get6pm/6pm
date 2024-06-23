import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodConfigCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema';
import { BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema';
import { BudgetPeriodConfigWhereUniqueInputSchema } from './BudgetPeriodConfigWhereUniqueInputSchema';

export const BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).optional(),
  connect: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).optional()
}).strict();

export default BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInputSchema;
