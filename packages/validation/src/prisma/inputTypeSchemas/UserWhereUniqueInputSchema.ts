import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { UserWalletAccountListRelationFilterSchema } from './UserWalletAccountListRelationFilterSchema';
import { BudgetUserListRelationFilterSchema } from './BudgetUserListRelationFilterSchema';
import { TransactionListRelationFilterSchema } from './TransactionListRelationFilterSchema';
import { BudgetUserInvitationListRelationFilterSchema } from './BudgetUserInvitationListRelationFilterSchema';
import { BudgetUserInvitationResponseNullableRelationFilterSchema } from './BudgetUserInvitationResponseNullableRelationFilterSchema';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';
import { CategoryListRelationFilterSchema } from './CategoryListRelationFilterSchema';

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    email: z.string()
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountListRelationFilterSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional(),
  createdFromInvitation: z.union([ z.lazy(() => BudgetUserInvitationResponseNullableRelationFilterSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional().nullable(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional()
}).strict());

export default UserWhereUniqueInputSchema;
