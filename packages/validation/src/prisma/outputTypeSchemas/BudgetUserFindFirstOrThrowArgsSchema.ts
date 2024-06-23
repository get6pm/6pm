import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserIncludeSchema } from '../inputTypeSchemas/BudgetUserIncludeSchema'
import { BudgetUserWhereInputSchema } from '../inputTypeSchemas/BudgetUserWhereInputSchema'
import { BudgetUserOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetUserOrderByWithRelationInputSchema'
import { BudgetUserWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserWhereUniqueInputSchema'
import { BudgetUserScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetUserScalarFieldEnumSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const BudgetUserSelectSchema: z.ZodType<Prisma.BudgetUserSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  userId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export const BudgetUserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserFindFirstOrThrowArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserScalarFieldEnumSchema,BudgetUserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetUserFindFirstOrThrowArgsSchema;
