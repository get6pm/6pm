import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { UserWalletAccountUpdateManyWithoutUserNestedInputSchema } from './UserWalletAccountUpdateManyWithoutUserNestedInputSchema';
import { BudgetUserUpdateManyWithoutUserNestedInputSchema } from './BudgetUserUpdateManyWithoutUserNestedInputSchema';
import { BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema } from './BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema';
import { BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema } from './BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema';
import { CategoryUpdateManyWithoutUserNestedInputSchema } from './CategoryUpdateManyWithoutUserNestedInputSchema';

export const UserUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export default UserUpdateWithoutTransactionsInputSchema;
