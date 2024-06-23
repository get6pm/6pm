import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutCategoryInputSchema } from './TransactionUpdateWithoutCategoryInputSchema';
import { TransactionUncheckedUpdateWithoutCategoryInputSchema } from './TransactionUncheckedUpdateWithoutCategoryInputSchema';

export const TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCategoryInputSchema) ]),
}).strict();

export default TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema;
