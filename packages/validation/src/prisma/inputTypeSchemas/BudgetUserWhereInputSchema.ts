import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { EnumBudgetUserPermissionFilterSchema } from './EnumBudgetUserPermissionFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { BudgetRelationFilterSchema } from './BudgetRelationFilterSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetUserWhereInputSchema: z.ZodType<Prisma.BudgetUserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict();

export default BudgetUserWhereInputSchema;
