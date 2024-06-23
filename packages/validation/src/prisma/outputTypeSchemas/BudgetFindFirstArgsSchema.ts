import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetIncludeSchema } from '../inputTypeSchemas/BudgetIncludeSchema'
import { BudgetWhereInputSchema } from '../inputTypeSchemas/BudgetWhereInputSchema'
import { BudgetOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetOrderByWithRelationInputSchema'
import { BudgetWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetWhereUniqueInputSchema'
import { BudgetScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetScalarFieldEnumSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { BudgetPeriodConfigArgsSchema } from "../outputTypeSchemas/BudgetPeriodConfigArgsSchema"
import { BudgetUserFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserFindManyArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { BudgetUserInvitationFindManyArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationFindManyArgsSchema"
import { BudgetCountOutputTypeArgsSchema } from "../outputTypeSchemas/BudgetCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const BudgetFindFirstArgsSchema: z.ZodType<Prisma.BudgetFindFirstArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetScalarFieldEnumSchema,BudgetScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetFindFirstArgsSchema;
