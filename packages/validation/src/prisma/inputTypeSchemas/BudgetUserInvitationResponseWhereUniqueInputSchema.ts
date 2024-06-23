import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationResponseWhereInputSchema } from './BudgetUserInvitationResponseWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { BudgetUserInvitationRelationFilterSchema } from './BudgetUserInvitationRelationFilterSchema';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';
import { UserNullableRelationFilterSchema } from './UserNullableRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const BudgetUserInvitationResponseWhereUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    createdUserId: z.string()
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    createdUserId: z.string(),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  createdUserId: z.string().optional(),
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  invitation: z.union([ z.lazy(() => BudgetUserInvitationRelationFilterSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema) ]).optional(),
  createdUser: z.union([ z.lazy(() => UserNullableRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
}).strict());

export default BudgetUserInvitationResponseWhereUniqueInputSchema;
