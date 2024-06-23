import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserWhereInputSchema } from '../inputTypeSchemas/BudgetUserWhereInputSchema'

export const BudgetUserDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserDeleteManyArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserDeleteManyArgsSchema;
