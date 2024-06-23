import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string()
}).strict();

export default BudgetUserUncheckedCreateWithoutBudgetInputSchema;
