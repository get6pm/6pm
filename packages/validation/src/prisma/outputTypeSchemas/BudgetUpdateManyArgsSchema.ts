import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUpdateManyMutationInputSchema } from '../inputTypeSchemas/BudgetUpdateManyMutationInputSchema'
import { BudgetUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/BudgetUncheckedUpdateManyInputSchema'
import { BudgetWhereInputSchema } from '../inputTypeSchemas/BudgetWhereInputSchema'

export const BudgetUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUpdateManyArgs> = z.object({
  data: z.union([ BudgetUpdateManyMutationInputSchema,BudgetUncheckedUpdateManyInputSchema ]),
  where: BudgetWhereInputSchema.optional(),
}).strict() ;

export default BudgetUpdateManyArgsSchema;
