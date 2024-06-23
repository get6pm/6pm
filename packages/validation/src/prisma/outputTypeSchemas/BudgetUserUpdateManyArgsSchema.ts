import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserUpdateManyMutationInputSchema } from '../inputTypeSchemas/BudgetUserUpdateManyMutationInputSchema'
import { BudgetUserUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/BudgetUserUncheckedUpdateManyInputSchema'
import { BudgetUserWhereInputSchema } from '../inputTypeSchemas/BudgetUserWhereInputSchema'

export const BudgetUserUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserUpdateManyMutationInputSchema,BudgetUserUncheckedUpdateManyInputSchema ]),
  where: BudgetUserWhereInputSchema.optional(),
}).strict() ;

export default BudgetUserUpdateManyArgsSchema;
