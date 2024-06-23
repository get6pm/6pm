import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema } from './UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema';
import { BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema } from './BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema';
import { TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema } from './TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema';
import { BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema } from './BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema';
import { BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema } from './BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema';

export const UserUncheckedUpdateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCategoriesInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional()
}).strict();

export default UserUncheckedUpdateWithoutCategoriesInputSchema;
