import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetCreateWithoutPeriodConfigInputSchema } from './BudgetCreateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedCreateWithoutPeriodConfigInputSchema } from './BudgetUncheckedCreateWithoutPeriodConfigInputSchema';

export const BudgetCreateOrConnectWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutPeriodConfigInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigInputSchema) ]),
}).strict();

export default BudgetCreateOrConnectWithoutPeriodConfigInputSchema;
