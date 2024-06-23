import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserIncludeSchema } from '../inputTypeSchemas/UserIncludeSchema'
import { UserWhereInputSchema } from '../inputTypeSchemas/UserWhereInputSchema'
import { UserOrderByWithRelationInputSchema } from '../inputTypeSchemas/UserOrderByWithRelationInputSchema'
import { UserWhereUniqueInputSchema } from '../inputTypeSchemas/UserWhereUniqueInputSchema'
import { UserScalarFieldEnumSchema } from '../inputTypeSchemas/UserScalarFieldEnumSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { UserWalletAccountFindManyArgsSchema } from "../outputTypeSchemas/UserWalletAccountFindManyArgsSchema"
import { BudgetUserFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserFindManyArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { BudgetUserInvitationFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationFindManyArgsSchema"
import { BudgetUserInvitationResponseArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationResponseArgsSchema"
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { UserCountOutputTypeArgsSchema } from "../outputTypeSchemas/UserCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  email: z.boolean().optional(),
  name: z.boolean().optional(),
  walletAccounts: z.union([z.boolean(),z.lazy(() => UserWalletAccountFindManyArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  createdBudgetUserInvitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  createdFromInvitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseArgsSchema)]).optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default UserFindManyArgsSchema;
