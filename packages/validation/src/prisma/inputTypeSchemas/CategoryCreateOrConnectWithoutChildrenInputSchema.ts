import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryCreateWithoutChildrenInputSchema } from './CategoryCreateWithoutChildrenInputSchema';
import { CategoryUncheckedCreateWithoutChildrenInputSchema } from './CategoryUncheckedCreateWithoutChildrenInputSchema';

export const CategoryCreateOrConnectWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutChildrenInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]),
}).strict();

export default CategoryCreateOrConnectWithoutChildrenInputSchema;
