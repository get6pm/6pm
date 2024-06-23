import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserPermissionSchema } from './BudgetUserPermissionSchema';
import { BudgetCreateNestedOneWithoutInvitationsInputSchema } from './BudgetCreateNestedOneWithoutInvitationsInputSchema';
import { BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema } from './BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema';

export const BudgetUserInvitationCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().uuid().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutInvitationsInputSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export default BudgetUserInvitationCreateWithoutCreatedByUserInputSchema;
