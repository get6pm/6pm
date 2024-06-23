import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const BudgetUserUserIdBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserUserIdBudgetIdCompoundUniqueInput> = z.object({
  userId: z.string(),
  budgetId: z.string()
}).strict();

export default BudgetUserUserIdBudgetIdCompoundUniqueInputSchema;
