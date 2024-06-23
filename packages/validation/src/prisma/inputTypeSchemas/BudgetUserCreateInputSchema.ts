import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserCreateNestedOneWithoutBudgetUsersInputSchema } from './UserCreateNestedOneWithoutBudgetUsersInputSchema';
import { BudgetCreateNestedOneWithoutBudgetUsersInputSchema } from './BudgetCreateNestedOneWithoutBudgetUsersInputSchema';

export const BudgetUserCreateInputSchema: z.ZodType<Prisma.BudgetUserCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutBudgetUsersInputSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export default BudgetUserCreateInputSchema;
