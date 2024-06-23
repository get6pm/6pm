import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutParentInputSchema } from './CategoryCreateWithoutParentInputSchema';
import { CategoryUncheckedCreateWithoutParentInputSchema } from './CategoryUncheckedCreateWithoutParentInputSchema';
import { CategoryCreateOrConnectWithoutParentInputSchema } from './CategoryCreateOrConnectWithoutParentInputSchema';
import { CategoryUpsertWithWhereUniqueWithoutParentInputSchema } from './CategoryUpsertWithWhereUniqueWithoutParentInputSchema';
import { CategoryCreateManyParentInputEnvelopeSchema } from './CategoryCreateManyParentInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithWhereUniqueWithoutParentInputSchema } from './CategoryUpdateWithWhereUniqueWithoutParentInputSchema';
import { CategoryUpdateManyWithWhereWithoutParentInputSchema } from './CategoryUpdateManyWithWhereWithoutParentInputSchema';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';

export const CategoryUncheckedUpdateManyWithoutParentNestedInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutParentNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CategoryUncheckedUpdateManyWithoutParentNestedInputSchema;
