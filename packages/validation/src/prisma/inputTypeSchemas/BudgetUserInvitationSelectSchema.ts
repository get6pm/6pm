import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
import { BudgetUserInvitationResponseFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationResponseFindManyArgsSchema"
import { BudgetUserInvitationCountOutputTypeArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationCountOutputTypeArgsSchema"

export const BudgetUserInvitationSelectSchema: z.ZodType<Prisma.BudgetUserInvitationSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  email: z.boolean().optional(),
  token: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  createdByUserId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  responses: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default BudgetUserInvitationSelectSchema;
