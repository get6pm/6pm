import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutPeriodConfigInputSchema } from './BudgetCreateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedCreateWithoutPeriodConfigInputSchema } from './BudgetUncheckedCreateWithoutPeriodConfigInputSchema';
import { BudgetCreateOrConnectWithoutPeriodConfigInputSchema } from './BudgetCreateOrConnectWithoutPeriodConfigInputSchema';
import { BudgetUpsertWithoutPeriodConfigInputSchema } from './BudgetUpsertWithoutPeriodConfigInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetUpdateToOneWithWhereWithoutPeriodConfigInputSchema } from './BudgetUpdateToOneWithWhereWithoutPeriodConfigInputSchema';
import { BudgetUpdateWithoutPeriodConfigInputSchema } from './BudgetUpdateWithoutPeriodConfigInputSchema';
import { BudgetUncheckedUpdateWithoutPeriodConfigInputSchema } from './BudgetUncheckedUpdateWithoutPeriodConfigInputSchema';

export const BudgetUpdateOneRequiredWithoutPeriodConfigNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutPeriodConfigNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutPeriodConfigInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutPeriodConfigInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUpdateWithoutPeriodConfigInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigInputSchema) ]).optional(),
}).strict();

export default BudgetUpdateOneRequiredWithoutPeriodConfigNestedInputSchema;
