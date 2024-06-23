import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';
import { TransactionUpdateManyMutationInputSchema } from './TransactionUpdateManyMutationInputSchema';
import { TransactionUncheckedUpdateManyWithoutBudgetInputSchema } from './TransactionUncheckedUpdateManyWithoutBudgetInputSchema';

export const TransactionUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export default TransactionUpdateManyWithWhereWithoutBudgetInputSchema;
