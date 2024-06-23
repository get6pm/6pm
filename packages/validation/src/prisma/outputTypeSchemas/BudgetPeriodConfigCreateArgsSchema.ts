import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigIncludeSchema } from '../inputTypeSchemas/BudgetPeriodConfigIncludeSchema'
import { BudgetPeriodConfigCreateInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigCreateInputSchema'
import { BudgetPeriodConfigUncheckedCreateInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigUncheckedCreateInputSchema'
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

export const BudgetPeriodConfigCreateArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  data: z.union([ BudgetPeriodConfigCreateInputSchema,BudgetPeriodConfigUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetPeriodConfigCreateArgsSchema;
