import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutTransactionsInputSchema } from './CategoryCreateWithoutTransactionsInputSchema';
import { CategoryUncheckedCreateWithoutTransactionsInputSchema } from './CategoryUncheckedCreateWithoutTransactionsInputSchema';
import { CategoryCreateOrConnectWithoutTransactionsInputSchema } from './CategoryCreateOrConnectWithoutTransactionsInputSchema';
import { CategoryUpsertWithoutTransactionsInputSchema } from './CategoryUpsertWithoutTransactionsInputSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema } from './CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema';
import { CategoryUpdateWithoutTransactionsInputSchema } from './CategoryUpdateWithoutTransactionsInputSchema';
import { CategoryUncheckedUpdateWithoutTransactionsInputSchema } from './CategoryUncheckedUpdateWithoutTransactionsInputSchema';

export const CategoryUpdateOneWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.CategoryUpdateOneWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => CategoryUpsertWithoutTransactionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export default CategoryUpdateOneWithoutTransactionsNestedInputSchema;
