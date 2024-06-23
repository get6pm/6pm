import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserCreateNestedOneWithoutBudgetUsersInputSchema } from './UserCreateNestedOneWithoutBudgetUsersInputSchema';

export const BudgetUserCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateWithoutBudgetInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export default BudgetUserCreateWithoutBudgetInputSchema;
