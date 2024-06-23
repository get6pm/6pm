import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryUpdateWithoutTransactionsInputSchema } from './CategoryUpdateWithoutTransactionsInputSchema';
import { CategoryUncheckedUpdateWithoutTransactionsInputSchema } from './CategoryUncheckedUpdateWithoutTransactionsInputSchema';
import { CategoryCreateWithoutTransactionsInputSchema } from './CategoryCreateWithoutTransactionsInputSchema';
import { CategoryUncheckedCreateWithoutTransactionsInputSchema } from './CategoryUncheckedCreateWithoutTransactionsInputSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';

export const CategoryUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export default CategoryUpsertWithoutTransactionsInputSchema;
