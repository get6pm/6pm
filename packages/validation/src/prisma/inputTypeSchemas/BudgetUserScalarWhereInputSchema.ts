import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { EnumBudgetUserPermissionFilterSchema } from './EnumBudgetUserPermissionFilterSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export default BudgetUserScalarWhereInputSchema;
