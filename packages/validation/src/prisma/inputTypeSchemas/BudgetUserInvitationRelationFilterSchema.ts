import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';

export const BudgetUserInvitationRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationRelationFilter> = z.object({
  is: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  isNot: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export default BudgetUserInvitationRelationFilterSchema;
