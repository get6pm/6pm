import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { EnumBudgetUserPermissionFieldUpdateOperationsInputSchema } from './EnumBudgetUserPermissionFieldUpdateOperationsInputSchema';
import { BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema } from './BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema';

export const BudgetUserUpdateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional()
}).strict();

export default BudgetUserUpdateWithoutUserInputSchema;
