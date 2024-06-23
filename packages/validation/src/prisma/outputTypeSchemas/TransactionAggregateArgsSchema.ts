import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionWhereInputSchema } from '../inputTypeSchemas/TransactionWhereInputSchema'
import { TransactionOrderByWithRelationInputSchema } from '../inputTypeSchemas/TransactionOrderByWithRelationInputSchema'
import { TransactionWhereUniqueInputSchema } from '../inputTypeSchemas/TransactionWhereUniqueInputSchema'

export const TransactionAggregateArgsSchema: z.ZodType<Prisma.TransactionAggregateArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithRelationInputSchema.array(),TransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: TransactionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default TransactionAggregateArgsSchema;
