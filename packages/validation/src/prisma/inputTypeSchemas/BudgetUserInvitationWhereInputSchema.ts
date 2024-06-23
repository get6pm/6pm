import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { EnumBudgetUserPermissionNullableFilterSchema } from './EnumBudgetUserPermissionNullableFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { BudgetRelationFilterSchema } from './BudgetRelationFilterSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUserInvitationResponseListRelationFilterSchema } from './BudgetUserInvitationResponseListRelationFilterSchema';

export const BudgetUserInvitationWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseListRelationFilterSchema).optional()
}).strict();

export default BudgetUserInvitationWhereInputSchema;
