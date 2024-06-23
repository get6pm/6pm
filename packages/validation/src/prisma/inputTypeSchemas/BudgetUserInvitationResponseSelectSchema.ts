import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"

export const BudgetUserInvitationResponseSelectSchema: z.ZodType<Prisma.BudgetUserInvitationResponseSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  acceptedAt: z.boolean().optional(),
  declinedAt: z.boolean().optional(),
  invitationId: z.boolean().optional(),
  createdUserId: z.boolean().optional(),
  invitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationArgsSchema)]).optional(),
  createdUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export default BudgetUserInvitationResponseSelectSchema;
