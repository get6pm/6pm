import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema } from './UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema';
import { BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema } from './BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema';
import { TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema } from './TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema';
import { CategoryUncheckedUpdateManyWithoutUserNestedInputSchema } from './CategoryUncheckedUpdateManyWithoutUserNestedInputSchema';

export const UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export default UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema;
