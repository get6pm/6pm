import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUpdateWithoutPeriodConfigInputSchema } from './BudgetUpdateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedUpdateWithoutPeriodConfigInputSchema } from './BudgetUncheckedUpdateWithoutPeriodConfigInputSchema';

export const BudgetUpdateToOneWithWhereWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutPeriodConfigInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigInputSchema) ]),
}).strict();

export default BudgetUpdateToOneWithWhereWithoutPeriodConfigInputSchema;
