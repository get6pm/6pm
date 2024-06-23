import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutCreatedFromInvitationInputSchema } from './UserCreateNestedOneWithoutCreatedFromInvitationInputSchema';

export const BudgetUserInvitationResponseCreateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateWithoutInvitationInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  createdUser: z.lazy(() => UserCreateNestedOneWithoutCreatedFromInvitationInputSchema).optional()
}).strict();

export default BudgetUserInvitationResponseCreateWithoutInvitationInputSchema;
