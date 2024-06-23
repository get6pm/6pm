import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { BudgetUserInvitationOrderByWithRelationInputSchema } from './BudgetUserInvitationOrderByWithRelationInputSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';

export const BudgetUserInvitationResponseOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  declinedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitation: z.lazy(() => BudgetUserInvitationOrderByWithRelationInputSchema).optional(),
  createdUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseOrderByWithRelationInputSchema;
