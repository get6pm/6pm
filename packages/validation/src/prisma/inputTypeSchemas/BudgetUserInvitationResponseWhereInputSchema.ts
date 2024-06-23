import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { BudgetUserInvitationRelationFilterSchema } from './BudgetUserInvitationRelationFilterSchema';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';
import { UserNullableRelationFilterSchema } from './UserNullableRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const BudgetUserInvitationResponseWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdUserId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  invitation: z.union([ z.lazy(() => BudgetUserInvitationRelationFilterSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema) ]).optional(),
  createdUser: z.union([ z.lazy(() => UserNullableRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
}).strict();

export default BudgetUserInvitationResponseWhereInputSchema;
