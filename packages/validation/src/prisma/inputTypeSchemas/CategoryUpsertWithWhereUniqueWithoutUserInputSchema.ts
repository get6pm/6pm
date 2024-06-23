import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithoutUserInputSchema } from './CategoryUpdateWithoutUserInputSchema';
import { CategoryUncheckedUpdateWithoutUserInputSchema } from './CategoryUncheckedUpdateWithoutUserInputSchema';
import { CategoryCreateWithoutUserInputSchema } from './CategoryCreateWithoutUserInputSchema';
import { CategoryUncheckedCreateWithoutUserInputSchema } from './CategoryUncheckedCreateWithoutUserInputSchema';

export const CategoryUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default CategoryUpsertWithWhereUniqueWithoutUserInputSchema;
