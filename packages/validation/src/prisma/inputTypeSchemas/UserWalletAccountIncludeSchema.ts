import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { UserWalletAccountCountOutputTypeArgsSchema } from "../outputTypeSchemas/UserWalletAccountCountOutputTypeArgsSchema"

export const UserWalletAccountIncludeSchema: z.ZodType<Prisma.UserWalletAccountInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserWalletAccountCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default UserWalletAccountIncludeSchema;
