import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryUpdateWithoutChildrenInputSchema } from './CategoryUpdateWithoutChildrenInputSchema';
import { CategoryUncheckedUpdateWithoutChildrenInputSchema } from './CategoryUncheckedUpdateWithoutChildrenInputSchema';
import { CategoryCreateWithoutChildrenInputSchema } from './CategoryCreateWithoutChildrenInputSchema';
import { CategoryUncheckedCreateWithoutChildrenInputSchema } from './CategoryUncheckedCreateWithoutChildrenInputSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';

export const CategoryUpsertWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUpsertWithoutChildrenInput> = z.object({
  update: z.union([ z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]),
  where: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export default CategoryUpsertWithoutChildrenInputSchema;
