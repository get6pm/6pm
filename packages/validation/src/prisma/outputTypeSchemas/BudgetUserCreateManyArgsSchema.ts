import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserCreateManyInputSchema } from '../inputTypeSchemas/BudgetUserCreateManyInputSchema'

export const BudgetUserCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserCreateManyArgs> = z.object({
  data: z.union([ BudgetUserCreateManyInputSchema,BudgetUserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetUserCreateManyArgsSchema;
