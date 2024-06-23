import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { EnumBudgetUserPermissionFieldUpdateOperationsInputSchema } from './EnumBudgetUserPermissionFieldUpdateOperationsInputSchema';

export const BudgetUserUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export default BudgetUserUncheckedUpdateWithoutUserInputSchema;
