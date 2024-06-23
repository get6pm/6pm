import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';
import { CategoryUpdateManyMutationInputSchema } from './CategoryUpdateManyMutationInputSchema';
import { CategoryUncheckedUpdateManyWithoutUserInputSchema } from './CategoryUncheckedUpdateManyWithoutUserInputSchema';

export const CategoryUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default CategoryUpdateManyWithWhereWithoutUserInputSchema;
