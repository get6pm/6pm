import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const BudgetUserInvitationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default BudgetUserInvitationOrderByRelationAggregateInputSchema;
