import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema } from './BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema';
import { UserCreateNestedOneWithoutCreatedFromInvitationInputSchema } from './UserCreateNestedOneWithoutCreatedFromInvitationInputSchema';

export const BudgetUserInvitationResponseCreateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema),
  createdUser: z.lazy(() => UserCreateNestedOneWithoutCreatedFromInvitationInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseCreateInputSchema;
