import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { EnumBudgetTypeFieldUpdateOperationsInputSchema } from './EnumBudgetTypeFieldUpdateOperationsInputSchema';
import { BudgetUserUpdateManyWithoutBudgetNestedInputSchema } from './BudgetUserUpdateManyWithoutBudgetNestedInputSchema';
import { TransactionUpdateManyWithoutBudgetNestedInputSchema } from './TransactionUpdateManyWithoutBudgetNestedInputSchema';
import { BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema } from './BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema';

export const BudgetUpdateWithoutPeriodConfigInputSchema: z.ZodType<Prisma.BudgetUpdateWithoutPeriodConfigInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export default BudgetUpdateWithoutPeriodConfigInputSchema;
