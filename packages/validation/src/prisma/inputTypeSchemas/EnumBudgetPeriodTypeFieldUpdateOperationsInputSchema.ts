import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';

export const EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetPeriodTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetPeriodTypeSchema).optional()
}).strict();

export default EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema;
