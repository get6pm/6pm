import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutTransactionsInputSchema } from './CategoryCreateWithoutTransactionsInputSchema';
import { CategoryUncheckedCreateWithoutTransactionsInputSchema } from './CategoryUncheckedCreateWithoutTransactionsInputSchema';

export const CategoryCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutTransactionsInputSchema;
