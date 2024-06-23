import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionCreateManyInputSchema } from '../inputTypeSchemas/TransactionCreateManyInputSchema'

export const TransactionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TransactionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TransactionCreateManyInputSchema,TransactionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default TransactionCreateManyAndReturnArgsSchema;
