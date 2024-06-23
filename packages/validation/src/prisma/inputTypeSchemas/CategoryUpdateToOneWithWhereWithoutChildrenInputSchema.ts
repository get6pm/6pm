import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { CategoryUpdateWithoutChildrenInputSchema } from './CategoryUpdateWithoutChildrenInputSchema';
import { CategoryUncheckedUpdateWithoutChildrenInputSchema } from './CategoryUncheckedUpdateWithoutChildrenInputSchema';

export const CategoryUpdateToOneWithWhereWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUpdateToOneWithWhereWithoutChildrenInput> = z.object({
  where: z.lazy(() => CategoryWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]),
}).strict();

export default CategoryUpdateToOneWithWhereWithoutChildrenInputSchema;
