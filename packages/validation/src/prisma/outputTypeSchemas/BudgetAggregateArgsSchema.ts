import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetWhereInputSchema } from '../inputTypeSchemas/BudgetWhereInputSchema'
import { BudgetOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetOrderByWithRelationInputSchema'
import { BudgetWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetWhereUniqueInputSchema'

export const BudgetAggregateArgsSchema: z.ZodType<Prisma.BudgetAggregateArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetAggregateArgsSchema;
