import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateNestedManyWithoutUserInputSchema } from './UserWalletAccountCreateNestedManyWithoutUserInputSchema';
import { BudgetUserCreateNestedManyWithoutUserInputSchema } from './BudgetUserCreateNestedManyWithoutUserInputSchema';
import { TransactionCreateNestedManyWithoutCreatedByUserInputSchema } from './TransactionCreateNestedManyWithoutCreatedByUserInputSchema';
import { BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema } from './BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema';
import { CategoryCreateNestedManyWithoutUserInputSchema } from './CategoryCreateNestedManyWithoutUserInputSchema';

export const UserCreateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export default UserCreateWithoutCreatedBudgetUserInvitationsInputSchema;
