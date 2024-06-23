import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema } from './BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema';
import { BudgetUserCreateNestedManyWithoutBudgetInputSchema } from './BudgetUserCreateNestedManyWithoutBudgetInputSchema';
import { TransactionCreateNestedManyWithoutBudgetInputSchema } from './TransactionCreateNestedManyWithoutBudgetInputSchema';

export const BudgetCreateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateWithoutInvitationsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfig: z.lazy(() => BudgetPeriodConfigCreateNestedOneWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export default BudgetCreateWithoutInvitationsInputSchema;
