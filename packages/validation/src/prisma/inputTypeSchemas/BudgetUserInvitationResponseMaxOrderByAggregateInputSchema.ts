import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserInvitationResponseMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.lazy(() => SortOrderSchema).optional(),
  declinedAt: z.lazy(() => SortOrderSchema).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserInvitationResponseMaxOrderByAggregateInputSchema;
