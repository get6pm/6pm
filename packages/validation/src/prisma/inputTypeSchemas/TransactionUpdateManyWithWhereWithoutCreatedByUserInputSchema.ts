import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';
import { TransactionUpdateManyMutationInputSchema } from './TransactionUpdateManyMutationInputSchema';
import { TransactionUncheckedUpdateManyWithoutCreatedByUserInputSchema } from './TransactionUncheckedUpdateManyWithoutCreatedByUserInputSchema';

export const TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserInputSchema) ]),
}).strict();

export default TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema;
