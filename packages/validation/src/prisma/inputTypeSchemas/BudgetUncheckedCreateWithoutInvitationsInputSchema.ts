import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInputSchema } from './BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInputSchema';
import { BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema } from './BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema';
import { TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema } from './TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema';

export const BudgetUncheckedCreateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateWithoutInvitationsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfig: z.lazy(() => BudgetPeriodConfigUncheckedCreateNestedOneWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export default BudgetUncheckedCreateWithoutInvitationsInputSchema;
