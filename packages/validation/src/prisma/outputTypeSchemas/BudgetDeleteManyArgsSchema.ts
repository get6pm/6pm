import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetWhereInputSchema } from '../inputTypeSchemas/BudgetWhereInputSchema'

export const BudgetDeleteManyArgsSchema: z.ZodType<Prisma.BudgetDeleteManyArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
}).strict() ;

export default BudgetDeleteManyArgsSchema;
