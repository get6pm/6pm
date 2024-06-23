import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUpdateWithoutPeriodConfigInputSchema } from './BudgetUpdateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedUpdateWithoutPeriodConfigInputSchema } from './BudgetUncheckedUpdateWithoutPeriodConfigInputSchema';
import { BudgetCreateWithoutPeriodConfigInputSchema } from './BudgetCreateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedCreateWithoutPeriodConfigInputSchema } from './BudgetUncheckedCreateWithoutPeriodConfigInputSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetUpsertWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutPeriodConfigInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export default BudgetUpsertWithoutPeriodConfigInputSchema;
