import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { UserWalletAccountOrderByRelationAggregateInputSchema } from './UserWalletAccountOrderByRelationAggregateInputSchema';
import { BudgetUserOrderByRelationAggregateInputSchema } from './BudgetUserOrderByRelationAggregateInputSchema';
import { TransactionOrderByRelationAggregateInputSchema } from './TransactionOrderByRelationAggregateInputSchema';
import { BudgetUserInvitationOrderByRelationAggregateInputSchema } from './BudgetUserInvitationOrderByRelationAggregateInputSchema';
import { BudgetUserInvitationResponseOrderByWithRelationInputSchema } from './BudgetUserInvitationResponseOrderByWithRelationInputSchema';
import { CategoryOrderByRelationAggregateInputSchema } from './CategoryOrderByRelationAggregateInputSchema';

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  walletAccounts: z.lazy(() => UserWalletAccountOrderByRelationAggregateInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserOrderByRelationAggregateInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationOrderByRelationAggregateInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseOrderByWithRelationInputSchema).optional(),
  categories: z.lazy(() => CategoryOrderByRelationAggregateInputSchema).optional()
}).strict();

export default UserOrderByWithRelationInputSchema;
