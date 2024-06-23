import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetCountOutputTypeSelectSchema } from './BudgetCountOutputTypeSelectSchema';

export const BudgetCountOutputTypeArgsSchema: z.ZodType<Prisma.BudgetCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => BudgetCountOutputTypeSelectSchema).nullish(),
}).strict();

export default BudgetCountOutputTypeSelectSchema;
