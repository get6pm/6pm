import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationEmailBudgetIdCompoundUniqueInput> = z.object({
  email: z.string(),
  budgetId: z.string()
}).strict();

export default BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema;
