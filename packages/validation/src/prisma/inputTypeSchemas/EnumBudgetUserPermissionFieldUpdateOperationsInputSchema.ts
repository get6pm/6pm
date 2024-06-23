import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const EnumBudgetUserPermissionFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetUserPermissionFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetUserPermissionSchema).optional()
}).strict();

export default EnumBudgetUserPermissionFieldUpdateOperationsInputSchema;
