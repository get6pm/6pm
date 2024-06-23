import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutUserInputSchema } from './CategoryUpdateWithoutUserInputSchema';
import { CategoryUncheckedUpdateWithoutUserInputSchema } from './CategoryUncheckedUpdateWithoutUserInputSchema';

export const CategoryUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default CategoryUpdateWithWhereUniqueWithoutUserInputSchema;
