import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { EnumBudgetUserPermissionFieldUpdateOperationsInputSchema } from './EnumBudgetUserPermissionFieldUpdateOperationsInputSchema';
import { UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema } from './UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema';
import { BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema } from './BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema';

export const BudgetUserUpdateInputSchema: z.ZodType<Prisma.BudgetUserUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional()
}).strict();

export default BudgetUserUpdateInputSchema;
