import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserIncludeSchema } from '../inputTypeSchemas/UserIncludeSchema'
import { UserWhereUniqueInputSchema } from '../inputTypeSchemas/UserWhereUniqueInputSchema'
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

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default UserFindUniqueOrThrowArgsSchema;
