import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema';
import { TransactionCreateNestedManyWithoutBudgetInputSchema } from './TransactionCreateNestedManyWithoutBudgetInputSchema';
import { BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema } from './BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema';

export const BudgetCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfig: z.lazy(() => BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export default BudgetCreateWithoutBudgetUsersInputSchema;
