import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateNestedManyWithoutUserInputSchema } from './UserWalletAccountCreateNestedManyWithoutUserInputSchema';
import { TransactionCreateNestedManyWithoutCreatedByUserInputSchema } from './TransactionCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema } from './BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema';
import { CategoryCreateNestedManyWithoutUserInputSchema } from './CategoryCreateNestedManyWithoutUserInputSchema';

export const UserCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export default UserCreateWithoutBudgetUsersInputSchema;
