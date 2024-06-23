import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserInvitationResponseOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserInvitationResponseOrderByRelationAggregateInputSchema;
