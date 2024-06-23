import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumBudgetUserPermissionFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetUserPermissionSchema).optional().nullable()
}).strict();

export default NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema;
