import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';

export const BudgetUserInvitationResponseListRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationResponseListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseListRelationFilterSchema;
