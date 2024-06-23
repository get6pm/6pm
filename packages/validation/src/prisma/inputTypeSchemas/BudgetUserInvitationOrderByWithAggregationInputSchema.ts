import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetUserInvitationCountOrderByAggregateInputSchema } from './BudgetUserInvitationCountOrderByAggregateInputSchema';
import { BudgetUserInvitationMaxOrderByAggregateInputSchema } from './BudgetUserInvitationMaxOrderByAggregateInputSchema';
import { BudgetUserInvitationMinOrderByAggregateInputSchema } from './BudgetUserInvitationMinOrderByAggregateInputSchema';

export const BudgetUserInvitationOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetUserInvitationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserInvitationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserInvitationMinOrderByAggregateInputSchema).optional()
}).strict();

export default BudgetUserInvitationOrderByWithAggregationInputSchema;
