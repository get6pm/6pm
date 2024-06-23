import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema } from './BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema';
import { BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema } from './BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema';
import { BudgetUserInvitationWhereInputSchema } from './BudgetUserInvitationWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumBudgetUserPermissionNullableFilterSchema } from './EnumBudgetUserPermissionNullableFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { BudgetRelationFilterSchema } from './BudgetRelationFilterSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUserInvitationResponseListRelationFilterSchema } from './BudgetUserInvitationResponseListRelationFilterSchema';

export const BudgetUserInvitationWhereUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationWhereUniqueInput> = z.union([
  z.object({
    id: z.string().cuid(),
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string().cuid(),
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string().cuid(),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string().cuid(),
  }),
  z.object({
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().cuid().optional(),
  token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema).optional(),
  email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string().uuid() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseListRelationFilterSchema).optional()
}).strict());

export default BudgetUserInvitationWhereUniqueInputSchema;
