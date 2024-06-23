import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetWhereInputSchema } from '../inputTypeSchemas/BudgetWhereInputSchema'
import { BudgetOrderByWithAggregationInputSchema } from '../inputTypeSchemas/BudgetOrderByWithAggregationInputSchema'
import { BudgetScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetScalarFieldEnumSchema'
import { BudgetScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/BudgetScalarWhereWithAggregatesInputSchema'

export const BudgetGroupByArgsSchema: z.ZodType<Prisma.BudgetGroupByArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithAggregationInputSchema.array(),BudgetOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetScalarFieldEnumSchema.array(),
  having: BudgetScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetGroupByArgsSchema;
