import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountIncludeSchema } from '../inputTypeSchemas/UserWalletAccountIncludeSchema'
import { UserWalletAccountCreateInputSchema } from '../inputTypeSchemas/UserWalletAccountCreateInputSchema'
import { UserWalletAccountUncheckedCreateInputSchema } from '../inputTypeSchemas/UserWalletAccountUncheckedCreateInputSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { UserWalletAccountCountOutputTypeArgsSchema } from "../outputTypeSchemas/UserWalletAccountCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const UserWalletAccountSelectSchema: z.ZodType<Prisma.UserWalletAccountSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  name: z.boolean().optional(),
  icon: z.boolean().optional(),
  description: z.boolean().optional(),
  lastDigits: z.boolean().optional(),
  preferredCurrency: z.boolean().optional(),
  userId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserWalletAccountCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserWalletAccountCreateArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  data: z.union([ UserWalletAccountCreateInputSchema,UserWalletAccountUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default UserWalletAccountCreateArgsSchema;
