import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutChildrenInputSchema } from './CategoryCreateWithoutChildrenInputSchema';
import { CategoryUncheckedCreateWithoutChildrenInputSchema } from './CategoryUncheckedCreateWithoutChildrenInputSchema';
import { CategoryCreateOrConnectWithoutChildrenInputSchema } from './CategoryCreateOrConnectWithoutChildrenInputSchema';
import { CategoryUpsertWithoutChildrenInputSchema } from './CategoryUpsertWithoutChildrenInputSchema';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateToOneWithWhereWithoutChildrenInputSchema } from './CategoryUpdateToOneWithWhereWithoutChildrenInputSchema';
import { CategoryUpdateWithoutChildrenInputSchema } from './CategoryUpdateWithoutChildrenInputSchema';
import { CategoryUncheckedUpdateWithoutChildrenInputSchema } from './CategoryUncheckedUpdateWithoutChildrenInputSchema';

export const CategoryUpdateOneWithoutChildrenNestedInputSchema: z.ZodType<Prisma.CategoryUpdateOneWithoutChildrenNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutChildrenInputSchema).optional(),
  upsert: z.lazy(() => CategoryUpsertWithoutChildrenInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateToOneWithWhereWithoutChildrenInputSchema),z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]).optional(),
}).strict();

export default CategoryUpdateOneWithoutChildrenNestedInputSchema;
