import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema } from './BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema';
import { TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema } from './BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema';
import { CategoryUncheckedCreateNestedManyWithoutUserInputSchema } from './CategoryUncheckedCreateNestedManyWithoutUserInputSchema';

export const UserUncheckedCreateWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutWalletAccountsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export default UserUncheckedCreateWithoutWalletAccountsInputSchema;
