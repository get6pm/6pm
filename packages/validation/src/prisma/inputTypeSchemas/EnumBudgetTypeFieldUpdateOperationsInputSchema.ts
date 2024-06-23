import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetTypeSchema } from './BudgetTypeSchema';

export const EnumBudgetTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetTypeSchema).optional()
}).strict();

export default EnumBudgetTypeFieldUpdateOperationsInputSchema;
