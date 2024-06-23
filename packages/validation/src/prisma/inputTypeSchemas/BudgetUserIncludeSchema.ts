import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"

export const BudgetUserIncludeSchema: z.ZodType<Prisma.BudgetUserInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export default BudgetUserIncludeSchema;
