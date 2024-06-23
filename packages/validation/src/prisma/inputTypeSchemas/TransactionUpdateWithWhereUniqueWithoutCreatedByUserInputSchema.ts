import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutCreatedByUserInputSchema } from './TransactionUpdateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedUpdateWithoutCreatedByUserInputSchema } from './TransactionUncheckedUpdateWithoutCreatedByUserInputSchema';

export const TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema;
