import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';
import { EnumBudgetUserPermissionWithAggregatesFilterSchema } from './EnumBudgetUserPermissionWithAggregatesFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetUserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionWithAggregatesFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export default BudgetUserScalarWhereWithAggregatesInputSchema;
