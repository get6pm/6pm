import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { EnumBudgetUserPermissionNullableFilterSchema } from './EnumBudgetUserPermissionNullableFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserInvitationScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export default BudgetUserInvitationScalarWhereInputSchema;
