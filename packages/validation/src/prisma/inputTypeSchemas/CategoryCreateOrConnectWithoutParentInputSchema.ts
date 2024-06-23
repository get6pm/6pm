import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutParentInputSchema } from './CategoryCreateWithoutParentInputSchema';
import { CategoryUncheckedCreateWithoutParentInputSchema } from './CategoryUncheckedCreateWithoutParentInputSchema';

export const CategoryCreateOrConnectWithoutParentInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutParentInputSchema;
