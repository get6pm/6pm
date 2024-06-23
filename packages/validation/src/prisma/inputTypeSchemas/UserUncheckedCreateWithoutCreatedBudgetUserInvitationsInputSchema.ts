import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema } from './UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema';
import { BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema } from './BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema';
import { TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema';
import { CategoryUncheckedCreateNestedManyWithoutUserInputSchema } from './CategoryUncheckedCreateNestedManyWithoutUserInputSchema';

export const UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export default UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema;
