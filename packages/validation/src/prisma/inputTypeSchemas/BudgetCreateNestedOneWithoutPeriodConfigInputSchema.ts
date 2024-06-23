import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutPeriodConfigInputSchema } from './BudgetCreateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedCreateWithoutPeriodConfigInputSchema } from './BudgetUncheckedCreateWithoutPeriodConfigInputSchema';
import { BudgetCreateOrConnectWithoutPeriodConfigInputSchema } from './BudgetCreateOrConnectWithoutPeriodConfigInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';

export const BudgetCreateNestedOneWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutPeriodConfigInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutPeriodConfigInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export default BudgetCreateNestedOneWithoutPeriodConfigInputSchema;
