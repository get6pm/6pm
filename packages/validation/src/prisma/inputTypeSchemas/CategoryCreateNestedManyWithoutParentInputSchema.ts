import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutParentInputSchema } from './CategoryCreateWithoutParentInputSchema';
import { CategoryUncheckedCreateWithoutParentInputSchema } from './CategoryUncheckedCreateWithoutParentInputSchema';
import { CategoryCreateOrConnectWithoutParentInputSchema } from './CategoryCreateOrConnectWithoutParentInputSchema';
import { CategoryCreateManyParentInputEnvelopeSchema } from './CategoryCreateManyParentInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedManyWithoutParentInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutParentInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CategoryCreateNestedManyWithoutParentInputSchema;
