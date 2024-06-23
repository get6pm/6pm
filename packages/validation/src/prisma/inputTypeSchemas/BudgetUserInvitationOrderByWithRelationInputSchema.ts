import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';
import { BudgetOrderByWithRelationInputSchema } from './BudgetOrderByWithRelationInputSchema';
import { BudgetUserInvitationResponseOrderByRelationAggregateInputSchema } from './BudgetUserInvitationResponseOrderByRelationAggregateInputSchema';

export const BudgetUserInvitationOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  createdByUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseOrderByRelationAggregateInputSchema).optional()
}).strict();

export default BudgetUserInvitationOrderByWithRelationInputSchema;
