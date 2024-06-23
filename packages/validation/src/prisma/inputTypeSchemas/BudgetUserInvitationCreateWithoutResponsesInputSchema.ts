import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema } from './UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema';
import { BudgetCreateNestedOneWithoutInvitationsInputSchema } from './BudgetCreateNestedOneWithoutInvitationsInputSchema';

export const BudgetUserInvitationCreateWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutResponsesInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().uuid().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutInvitationsInputSchema)
}).strict();

export default BudgetUserInvitationCreateWithoutResponsesInputSchema;
