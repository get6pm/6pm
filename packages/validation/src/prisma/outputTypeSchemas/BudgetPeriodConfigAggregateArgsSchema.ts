import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigWhereInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereInputSchema'
import { BudgetPeriodConfigOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigOrderByWithRelationInputSchema'
import { BudgetPeriodConfigWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereUniqueInputSchema'

export const BudgetPeriodConfigAggregateArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigAggregateArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetPeriodConfigAggregateArgsSchema;
