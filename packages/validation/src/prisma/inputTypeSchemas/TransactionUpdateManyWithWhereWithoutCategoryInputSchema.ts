import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';
import { TransactionUpdateManyMutationInputSchema } from './TransactionUpdateManyMutationInputSchema';
import { TransactionUncheckedUpdateManyWithoutCategoryInputSchema } from './TransactionUncheckedUpdateManyWithoutCategoryInputSchema';

export const TransactionUpdateManyWithWhereWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryInputSchema) ]),
}).strict();

export default TransactionUpdateManyWithWhereWithoutCategoryInputSchema;
