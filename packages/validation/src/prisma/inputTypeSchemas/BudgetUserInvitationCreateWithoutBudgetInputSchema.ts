import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema';
import { BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema';

export const BudgetUserInvitationCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutBudgetInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().uuid().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export default BudgetUserInvitationCreateWithoutBudgetInputSchema;
