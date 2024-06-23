import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationTokenBudgetIdCompoundUniqueInput> = z.object({
  token: z.string(),
  budgetId: z.string()
}).strict();

export default BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema;
