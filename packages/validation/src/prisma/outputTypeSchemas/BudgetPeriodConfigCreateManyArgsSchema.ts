import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigCreateManyInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigCreateManyInputSchema'

export const BudgetPeriodConfigCreateManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyArgs> = z.object({
  data: z.union([ BudgetPeriodConfigCreateManyInputSchema,BudgetPeriodConfigCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetPeriodConfigCreateManyArgsSchema;
