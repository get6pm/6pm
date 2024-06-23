import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigUpdateManyMutationInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigUpdateManyMutationInputSchema'
import { BudgetPeriodConfigUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigUncheckedUpdateManyInputSchema'
import { BudgetPeriodConfigWhereInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereInputSchema'

export const BudgetPeriodConfigUpdateManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateManyArgs> = z.object({
  data: z.union([ BudgetPeriodConfigUpdateManyMutationInputSchema,BudgetPeriodConfigUncheckedUpdateManyInputSchema ]),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
}).strict() ;

export default BudgetPeriodConfigUpdateManyArgsSchema;
