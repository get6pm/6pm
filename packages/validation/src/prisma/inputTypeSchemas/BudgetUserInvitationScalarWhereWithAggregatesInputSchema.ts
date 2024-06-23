import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { EnumBudgetUserPermissionNullableWithAggregatesFilterSchema } from './EnumBudgetUserPermissionNullableWithAggregatesFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserInvitationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetUserInvitationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableWithAggregatesFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export default BudgetUserInvitationScalarWhereWithAggregatesInputSchema;
