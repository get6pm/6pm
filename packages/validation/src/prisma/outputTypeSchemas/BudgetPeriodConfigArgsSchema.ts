import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigSelectSchema } from '../inputTypeSchemas/BudgetPeriodConfigSelectSchema';
import { BudgetPeriodConfigIncludeSchema } from '../inputTypeSchemas/BudgetPeriodConfigIncludeSchema';

export const BudgetPeriodConfigArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigDefaultArgs> = z.object({
  select: z.lazy(() => BudgetPeriodConfigSelectSchema).optional(),
  include: z.lazy(() => BudgetPeriodConfigIncludeSchema).optional(),
}).strict();

export default BudgetPeriodConfigArgsSchema;
