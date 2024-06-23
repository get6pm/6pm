import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { CategoryUpdateWithoutTransactionsInputSchema } from './CategoryUpdateWithoutTransactionsInputSchema';
import { CategoryUncheckedUpdateWithoutTransactionsInputSchema } from './CategoryUncheckedUpdateWithoutTransactionsInputSchema';

export const CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => CategoryWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export default CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema;
