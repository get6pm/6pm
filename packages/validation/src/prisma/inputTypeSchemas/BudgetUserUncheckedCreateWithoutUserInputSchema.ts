import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  budgetId: z.string()
}).strict();

export default BudgetUserUncheckedCreateWithoutUserInputSchema;
