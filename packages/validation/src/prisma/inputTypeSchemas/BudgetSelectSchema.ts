import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigArgsSchema } from "../outputTypeSchemas/BudgetPeriodConfigArgsSchema"
import { BudgetUserFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserFindManyArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { BudgetUserInvitationFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationFindManyArgsSchema"
import { BudgetCountOutputTypeArgsSchema } from "../outputTypeSchemas/BudgetCountOutputTypeArgsSchema"

export const BudgetSelectSchema: z.ZodType<Prisma.BudgetSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  preferredCurrency: z.boolean().optional(),
  type: z.boolean().optional(),
  periodConfig: z.union([z.boolean(),z.lazy(() => BudgetPeriodConfigArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  invitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default BudgetSelectSchema;
