import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutCategoryInputSchema } from './TransactionUpdateWithoutCategoryInputSchema';
import { TransactionUncheckedUpdateWithoutCategoryInputSchema } from './TransactionUncheckedUpdateWithoutCategoryInputSchema';
import { TransactionCreateWithoutCategoryInputSchema } from './TransactionCreateWithoutCategoryInputSchema';
import { TransactionUncheckedCreateWithoutCategoryInputSchema } from './TransactionUncheckedCreateWithoutCategoryInputSchema';

export const TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCategoryInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export default TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema;
