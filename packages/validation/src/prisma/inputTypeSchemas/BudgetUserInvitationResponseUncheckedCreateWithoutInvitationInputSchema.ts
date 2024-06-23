import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  createdUserId: z.string().optional().nullable()
}).strict();

export default BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema;
