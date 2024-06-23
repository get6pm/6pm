import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema } from './BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema';

export const BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().uuid().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export default BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema;
