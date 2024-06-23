import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserSelectSchema } from '../inputTypeSchemas/BudgetUserSelectSchema';
import { BudgetUserIncludeSchema } from '../inputTypeSchemas/BudgetUserIncludeSchema';

export const BudgetUserArgsSchema: z.ZodType<Prisma.BudgetUserDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserSelectSchema).optional(),
  include: z.lazy(() => BudgetUserIncludeSchema).optional(),
}).strict();

export default BudgetUserArgsSchema;
