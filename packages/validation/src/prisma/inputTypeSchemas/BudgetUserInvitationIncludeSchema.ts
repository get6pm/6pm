import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
import { BudgetUserInvitationResponseFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationResponseFindManyArgsSchema"
import { BudgetUserInvitationCountOutputTypeArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationCountOutputTypeArgsSchema"

export const BudgetUserInvitationIncludeSchema: z.ZodType<Prisma.BudgetUserInvitationInclude> = z.object({
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  responses: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default BudgetUserInvitationIncludeSchema;
