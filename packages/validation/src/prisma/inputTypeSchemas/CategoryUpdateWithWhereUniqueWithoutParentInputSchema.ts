import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutParentInputSchema } from './CategoryUpdateWithoutParentInputSchema';
import { CategoryUncheckedUpdateWithoutParentInputSchema } from './CategoryUncheckedUpdateWithoutParentInputSchema';

export const CategoryUpdateWithWhereUniqueWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutParentInputSchema) ]),
}).strict();

export default CategoryUpdateWithWhereUniqueWithoutParentInputSchema;
