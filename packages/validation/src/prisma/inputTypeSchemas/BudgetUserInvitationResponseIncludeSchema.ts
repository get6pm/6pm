import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"

export const BudgetUserInvitationResponseIncludeSchema: z.ZodType<Prisma.BudgetUserInvitationResponseInclude> = z.object({
  invitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationArgsSchema)]).optional(),
  createdUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export default BudgetUserInvitationResponseIncludeSchema;
