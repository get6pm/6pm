import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const NestedEnumBudgetUserPermissionFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema) ]).optional(),
}).strict();

export default NestedEnumBudgetUserPermissionFilterSchema;
