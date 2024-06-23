import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { BudgetUserCreateNestedManyWithoutBudgetInputSchema } from './BudgetUserCreateNestedManyWithoutBudgetInputSchema';
import { TransactionCreateNestedManyWithoutBudgetInputSchema } from './TransactionCreateNestedManyWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema } from './BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema';

export const BudgetCreateWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetCreateWithoutPeriodConfigInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export default BudgetCreateWithoutPeriodConfigInputSchema;
