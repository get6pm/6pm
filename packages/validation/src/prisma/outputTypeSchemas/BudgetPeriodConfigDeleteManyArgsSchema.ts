import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetPeriodConfigWhereInputSchema } from '../inputTypeSchemas/BudgetPeriodConfigWhereInputSchema'

export const BudgetPeriodConfigDeleteManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigDeleteManyArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
}).strict() ;

export default BudgetPeriodConfigDeleteManyArgsSchema;
