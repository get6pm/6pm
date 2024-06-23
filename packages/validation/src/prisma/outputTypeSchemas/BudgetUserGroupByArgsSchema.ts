import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserWhereInputSchema } from '../inputTypeSchemas/BudgetUserWhereInputSchema'
import { BudgetUserOrderByWithAggregationInputSchema } from '../inputTypeSchemas/BudgetUserOrderByWithAggregationInputSchema'
import { BudgetUserScalarFieldEnumSchema } from '../inputTypeSchemas/BudgetUserScalarFieldEnumSchema'
import { BudgetUserScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/BudgetUserScalarWhereWithAggregatesInputSchema'

export const BudgetUserGroupByArgsSchema: z.ZodType<Prisma.BudgetUserGroupByArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithAggregationInputSchema.array(),BudgetUserOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserScalarFieldEnumSchema.array(),
  having: BudgetUserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserGroupByArgsSchema;
