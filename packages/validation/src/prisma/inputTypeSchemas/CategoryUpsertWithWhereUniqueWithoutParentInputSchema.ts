import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutParentInputSchema } from './CategoryUpdateWithoutParentInputSchema';
import { CategoryUncheckedUpdateWithoutParentInputSchema } from './CategoryUncheckedUpdateWithoutParentInputSchema';
import { CategoryCreateWithoutParentInputSchema } from './CategoryCreateWithoutParentInputSchema';
import { CategoryUncheckedCreateWithoutParentInputSchema } from './CategoryUncheckedCreateWithoutParentInputSchema';

export const CategoryUpsertWithWhereUniqueWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutParentInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema) ]),
}).strict();

export default CategoryUpsertWithWhereUniqueWithoutParentInputSchema;
