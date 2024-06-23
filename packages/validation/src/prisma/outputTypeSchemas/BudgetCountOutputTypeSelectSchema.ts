import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const BudgetCountOutputTypeSelectSchema: z.ZodType<Prisma.BudgetCountOutputTypeSelect> = z.object({
  budgetUsers: z.boolean().optional(),
  transactions: z.boolean().optional(),
  invitations: z.boolean().optional(),
}).strict();

export default BudgetCountOutputTypeSelectSchema;
