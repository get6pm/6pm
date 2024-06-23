import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserInvitationMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserInvitationMinOrderByAggregateInputSchema;
