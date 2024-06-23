import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';

export const BudgetUserInvitationResponseScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdUserId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export default BudgetUserInvitationResponseScalarWhereInputSchema;
