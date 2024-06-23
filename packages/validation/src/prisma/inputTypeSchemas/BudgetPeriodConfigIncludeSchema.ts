import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"

export const BudgetPeriodConfigIncludeSchema: z.ZodType<Prisma.BudgetPeriodConfigInclude> = z.object({
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export default BudgetPeriodConfigIncludeSchema;
