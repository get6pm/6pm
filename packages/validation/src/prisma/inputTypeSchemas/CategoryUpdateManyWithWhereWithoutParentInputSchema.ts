import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';
import { CategoryUpdateManyMutationInputSchema } from './CategoryUpdateManyMutationInputSchema';
import { CategoryUncheckedUpdateManyWithoutParentInputSchema } from './CategoryUncheckedUpdateManyWithoutParentInputSchema';

export const CategoryUpdateManyWithWhereWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutParentInputSchema) ]),
}).strict();

export default CategoryUpdateManyWithWhereWithoutParentInputSchema;
