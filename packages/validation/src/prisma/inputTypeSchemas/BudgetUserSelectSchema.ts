import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"

export const BudgetUserSelectSchema: z.ZodType<Prisma.BudgetUserSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  userId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export default BudgetUserSelectSchema;
