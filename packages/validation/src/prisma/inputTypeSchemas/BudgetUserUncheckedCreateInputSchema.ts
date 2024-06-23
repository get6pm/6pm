import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string(),
  budgetId: z.string()
}).strict();

export default BudgetUserUncheckedCreateInputSchema;
