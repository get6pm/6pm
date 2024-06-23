import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';

export const BudgetUserInvitationResponseNullableRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationResponseNullableRelationFilter> = z.object({
  is: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional().nullable()
}).strict();

export default BudgetUserInvitationResponseNullableRelationFilterSchema;
