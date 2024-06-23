import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryArgsSchema } from "../outputTypeSchemas/CategoryArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
import { UserWalletAccountArgsSchema } from "../outputTypeSchemas/UserWalletAccountArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"

export const TransactionIncludeSchema: z.ZodType<Prisma.TransactionInclude> = z.object({
  category: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  walletAccount: z.union([z.boolean(),z.lazy(() => UserWalletAccountArgsSchema)]).optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export default TransactionIncludeSchema;
