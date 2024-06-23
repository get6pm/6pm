import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountIncludeSchema } from '../inputTypeSchemas/UserWalletAccountIncludeSchema'
import { UserWalletAccountWhereInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereInputSchema'
import { UserWalletAccountOrderByWithRelationInputSchema } from '../inputTypeSchemas/UserWalletAccountOrderByWithRelationInputSchema'
import { UserWalletAccountWhereUniqueInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereUniqueInputSchema'
import { UserWalletAccountScalarFieldEnumSchema } from '../inputTypeSchemas/UserWalletAccountScalarFieldEnumSchema'
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

export const UserWalletAccountFindFirstArgsSchema: z.ZodType<Prisma.UserWalletAccountFindFirstArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserWalletAccountScalarFieldEnumSchema,UserWalletAccountScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default UserWalletAccountFindFirstArgsSchema;
