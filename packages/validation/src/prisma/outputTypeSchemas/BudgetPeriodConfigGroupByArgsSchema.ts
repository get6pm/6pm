import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigWhereInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereInputSchema'
import { BudgetPeriodConfigOrderByWithAggregationInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigOrderByWithAggregationInputSchema'
import { BudgetPeriodConfigScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetPeriodConfigScalarFieldEnumSchema'
import { BudgetPeriodConfigScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigScalarWhereWithAggregatesInputSchema'

export const BudgetPeriodConfigGroupByArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigGroupByArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithAggregationInputSchema.array(),BudgetPeriodConfigOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetPeriodConfigScalarFieldEnumSchema.array(),
  having: BudgetPeriodConfigScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetPeriodConfigGroupByArgsSchema;
