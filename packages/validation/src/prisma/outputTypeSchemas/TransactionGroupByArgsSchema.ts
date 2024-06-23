import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionWhereInputSchema } from '../inputTypeSchemas/TransactionWhereInputSchema'
import { TransactionOrderByWithAggregationInputSchema } from '../inputTypeSchemas/TransactionOrderByWithAggregationInputSchema'
import { TransactionScalarFieldEnumSchema } from '../inputTypeSchemas/TransactionScalarFieldEnumSchema'
import { TransactionScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/TransactionScalarWhereWithAggregatesInputSchema'

export const TransactionGroupByArgsSchema: z.ZodType<Prisma.TransactionGroupByArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithAggregationInputSchema.array(),TransactionOrderByWithAggregationInputSchema ]).optional(),
  by: TransactionScalarFieldEnumSchema.array(),
  having: TransactionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default TransactionGroupByArgsSchema;
