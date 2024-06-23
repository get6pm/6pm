import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { NestedEnumBudgetUserPermissionFilterSchema } from './NestedEnumBudgetUserPermissionFilterSchema';

export const EnumBudgetUserPermissionFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema) ]).optional(),
}).strict();

export default EnumBudgetUserPermissionFilterSchema;
