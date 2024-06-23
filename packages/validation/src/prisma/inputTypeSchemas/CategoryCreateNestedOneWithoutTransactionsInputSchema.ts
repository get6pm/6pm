import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutTransactionsInputSchema } from './CategoryCreateWithoutTransactionsInputSchema';
import { CategoryUncheckedCreateWithoutTransactionsInputSchema } from './CategoryUncheckedCreateWithoutTransactionsInputSchema';
import { CategoryCreateOrConnectWithoutTransactionsInputSchema } from './CategoryCreateOrConnectWithoutTransactionsInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional()
}).strict();

export default CategoryCreateNestedOneWithoutTransactionsInputSchema;
