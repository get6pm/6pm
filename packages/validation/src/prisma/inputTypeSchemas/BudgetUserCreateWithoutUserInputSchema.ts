import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { BudgetCreateNestedOneWithoutBudgetUsersInputSchema } from './BudgetCreateNestedOneWithoutBudgetUsersInputSchema';

export const BudgetUserCreateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserCreateWithoutUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export default BudgetUserCreateWithoutUserInputSchema;
