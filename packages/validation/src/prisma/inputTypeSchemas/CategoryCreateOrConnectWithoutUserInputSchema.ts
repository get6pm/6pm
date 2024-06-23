import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutUserInputSchema } from './CategoryCreateWithoutUserInputSchema';
import { CategoryUncheckedCreateWithoutUserInputSchema } from './CategoryUncheckedCreateWithoutUserInputSchema';

export const CategoryCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutUserInputSchema;
