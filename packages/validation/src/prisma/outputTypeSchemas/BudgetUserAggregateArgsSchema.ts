import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserWhereInputSchema } from '../inputTypeSchemas/BudgetUserWhereInputSchema'
import { BudgetUserOrderByWithRelationInputSchema } from '../inputTypeSchemas/BudgetUserOrderByWithRelationInputSchema'
import { BudgetUserWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserWhereUniqueInputSchema'

export const BudgetUserAggregateArgsSchema: z.ZodType<Prisma.BudgetUserAggregateArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default BudgetUserAggregateArgsSchema;
