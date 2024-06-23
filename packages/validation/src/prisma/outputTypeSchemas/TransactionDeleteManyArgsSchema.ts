import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionWhereInputSchema } from '../inputTypeSchemas/TransactionWhereInputSchema'

export const TransactionDeleteManyArgsSchema: z.ZodType<Prisma.TransactionDeleteManyArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
}).strict() ;

export default TransactionDeleteManyArgsSchema;
