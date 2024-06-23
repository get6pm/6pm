import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutChildrenInputSchema } from './CategoryCreateWithoutChildrenInputSchema';
import { CategoryUncheckedCreateWithoutChildrenInputSchema } from './CategoryUncheckedCreateWithoutChildrenInputSchema';
import { CategoryCreateOrConnectWithoutChildrenInputSchema } from './CategoryCreateOrConnectWithoutChildrenInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedOneWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateNestedOneWithoutChildrenInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutChildrenInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional()
}).strict();

export default CategoryCreateNestedOneWithoutChildrenInputSchema;
