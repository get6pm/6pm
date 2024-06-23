import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';

export const BudgetUserInvitationCreateManyCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyCreatedByUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().uuid().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  budgetId: z.string()
}).strict();

export default BudgetUserInvitationCreateManyCreatedByUserInputSchema;
