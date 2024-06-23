import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { NestedIntNullableFilterSchema } from './NestedIntNullableFilterSchema';
import { NestedEnumBudgetUserPermissionNullableFilterSchema } from './NestedEnumBudgetUserPermissionNullableFilterSchema';

export const NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionNullableWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional()
}).strict();

export default NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema;
