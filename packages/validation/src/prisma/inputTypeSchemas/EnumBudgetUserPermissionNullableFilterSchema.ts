import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { NestedEnumBudgetUserPermissionNullableFilterSchema } from './NestedEnumBudgetUserPermissionNullableFilterSchema';

export const EnumBudgetUserPermissionNullableFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionNullableFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema) ]).optional().nullable(),
}).strict();

export default EnumBudgetUserPermissionNullableFilterSchema;
