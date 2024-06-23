import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigIncludeSchema } from '../inputTypeSchemas/BudgetPeriodConfigIncludeSchema'
import { BudgetPeriodConfigWhereInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereInputSchema'
import { BudgetPeriodConfigOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigOrderByWithRelationInputSchema'
import { BudgetPeriodConfigWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereUniqueInputSchema'
import { BudgetPeriodConfigScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetPeriodConfigScalarFieldEnumSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { BudgetArgsSchema } from "../outputTypeSchemas/BudgetArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const BudgetPeriodConfigSelectSchema: z.ZodType<Prisma.BudgetPeriodConfigSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  type: z.boolean().optional(),
  amount: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export const BudgetPeriodConfigFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindFirstOrThrowArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetPeriodConfigScalarFieldEnumSchema,BudgetPeriodConfigScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetPeriodConfigFindFirstOrThrowArgsSchema;
