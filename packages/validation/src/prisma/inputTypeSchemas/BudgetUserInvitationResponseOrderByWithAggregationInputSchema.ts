import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetUserInvitationResponseCountOrderByAggregateInputSchema } from './BudgetUserInvitationResponseCountOrderByAggregateInputSchema';
import { BudgetUserInvitationResponseMaxOrderByAggregateInputSchema } from './BudgetUserInvitationResponseMaxOrderByAggregateInputSchema';
import { BudgetUserInvitationResponseMinOrderByAggregateInputSchema } from './BudgetUserInvitationResponseMinOrderByAggregateInputSchema';

export const BudgetUserInvitationResponseOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  declinedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => BudgetUserInvitationResponseCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserInvitationResponseMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserInvitationResponseMinOrderByAggregateInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseOrderByWithAggregationInputSchema;
