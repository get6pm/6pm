import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { EnumBudgetTypeFieldUpdateOperationsInputSchema } from './EnumBudgetTypeFieldUpdateOperationsInputSchema';
import { BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInputSchema } from './BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInputSchema';
import { BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema } from './BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema';
import { BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema } from './BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema';

export const BudgetUncheckedUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfig: z.lazy(() => BudgetPeriodConfigUncheckedUpdateOneWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export default BudgetUncheckedUpdateWithoutTransactionsInputSchema;
