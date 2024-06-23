import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';

export const BudgetUserInvitationListRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export default BudgetUserInvitationListRelationFilterSchema;
