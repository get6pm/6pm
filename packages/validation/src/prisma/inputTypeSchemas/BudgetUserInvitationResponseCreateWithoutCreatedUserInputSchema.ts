import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema } from './BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema';

export const BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateWithoutCreatedUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema)
}).strict();

export default BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema;
