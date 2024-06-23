import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { NestedIntFilterSchema } from './NestedIntFilterSchema';
import { NestedEnumBudgetUserPermissionFilterSchema } from './NestedEnumBudgetUserPermissionFilterSchema';

export const NestedEnumBudgetUserPermissionWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional()
}).strict();

export default NestedEnumBudgetUserPermissionWithAggregatesFilterSchema;
