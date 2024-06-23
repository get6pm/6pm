import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigCreateManyInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigCreateManyInputSchema'

export const BudgetPeriodConfigCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetPeriodConfigCreateManyInputSchema,BudgetPeriodConfigCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default BudgetPeriodConfigCreateManyAndReturnArgsSchema;
