import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserCreateManyInputSchema } from '../inputTypeSchemas/BudgetUserCreateManyInputSchema'

export const BudgetUserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetUserCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetUserCreateManyInputSchema,BudgetUserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetUserCreateManyAndReturnArgsSchema;
