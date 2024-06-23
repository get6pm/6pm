import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetCreateManyInputSchema } from '../inputTypeSchemas/BudgetCreateManyInputSchema'

export const BudgetCreateManyArgsSchema: z.ZodType<Prisma.BudgetCreateManyArgs> = z.object({
  data: z.union([ BudgetCreateManyInputSchema,BudgetCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetCreateManyArgsSchema;
