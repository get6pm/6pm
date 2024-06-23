import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetSelectSchema } from '../inputTypeSchemas/BudgetSelectSchema';
import { BudgetIncludeSchema } from '../inputTypeSchemas/BudgetIncludeSchema';

export const BudgetArgsSchema: z.ZodType<Prisma.BudgetDefaultArgs> = z.object({
  select: z.lazy(() => BudgetSelectSchema).optional(),
  include: z.lazy(() => BudgetIncludeSchema).optional(),
}).strict();

export default BudgetArgsSchema;
