import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutUserInputSchema } from './CategoryCreateWithoutUserInputSchema';
import { CategoryUncheckedCreateWithoutUserInputSchema } from './CategoryUncheckedCreateWithoutUserInputSchema';
import { CategoryCreateOrConnectWithoutUserInputSchema } from './CategoryCreateOrConnectWithoutUserInputSchema';
import { CategoryUpsertWithWhereUniqueWithoutUserInputSchema } from './CategoryUpsertWithWhereUniqueWithoutUserInputSchema';
import { CategoryCreateManyUserInputEnvelopeSchema } from './CategoryCreateManyUserInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';
import { CategoryUpdateWithWhereUniqueWithoutUserInputSchema } from './CategoryUpdateWithWhereUniqueWithoutUserInputSchema';
import { CategoryUpdateManyWithWhereWithoutUserInputSchema } from './CategoryUpdateManyWithWhereWithoutUserInputSchema';
import { CategoryScalarWhereInputSchema } from './CategoryScalarWhereInputSchema';

export const CategoryUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default CategoryUpdateManyWithoutUserNestedInputSchema;
