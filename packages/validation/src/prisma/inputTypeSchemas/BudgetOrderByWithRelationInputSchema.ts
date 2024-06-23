import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetPeriodConfigOrderByWithRelationInputSchema } from './BudgetPeriodConfigOrderByWithRelationInputSchema';
import { BudgetUserOrderByRelationAggregateInputSchema } from './BudgetUserOrderByRelationAggregateInputSchema';
import { TransactionOrderByRelationAggregateInputSchema } from './TransactionOrderByRelationAggregateInputSchema';
import { BudgetUserInvitationOrderByRelationAggregateInputSchema } from './BudgetUserInvitationOrderByRelationAggregateInputSchema';

export const BudgetOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  periodConfig: z.lazy(() => BudgetPeriodConfigOrderByWithRelationInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserOrderByRelationAggregateInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationOrderByRelationAggregateInputSchema).optional()
}).strict();

export default BudgetOrderByWithRelationInputSchema;
