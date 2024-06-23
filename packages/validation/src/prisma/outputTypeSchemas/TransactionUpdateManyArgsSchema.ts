import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionUpdateManyMutationInputSchema } from '../inputTypeSchemas/TransactionUpdateManyMutationInputSchema'
import { TransactionUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/TransactionUncheckedUpdateManyInputSchema'
import { TransactionWhereInputSchema } from '../inputTypeSchemas/TransactionWhereInputSchema'

export const TransactionUpdateManyArgsSchema: z.ZodType<Prisma.TransactionUpdateManyArgs> = z.object({
  data: z.union([ TransactionUpdateManyMutationInputSchema,TransactionUncheckedUpdateManyInputSchema ]),
  where: TransactionWhereInputSchema.optional(),
}).strict() ;

export default TransactionUpdateManyArgsSchema;
