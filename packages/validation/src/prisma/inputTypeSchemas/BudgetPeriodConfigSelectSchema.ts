import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"

export const BudgetPeriodConfigSelectSchema: z.ZodType<Prisma.BudgetPeriodConfigSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  type: z.boolean().optional(),
  amount: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export default BudgetPeriodConfigSelectSchema;
