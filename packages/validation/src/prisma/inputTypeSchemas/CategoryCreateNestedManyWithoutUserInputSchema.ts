import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateWithoutUserInputSchema } from './CategoryCreateWithoutUserInputSchema';
import { CategoryUncheckedCreateWithoutUserInputSchema } from './CategoryUncheckedCreateWithoutUserInputSchema';
import { CategoryCreateOrConnectWithoutUserInputSchema } from './CategoryCreateOrConnectWithoutUserInputSchema';
import { CategoryCreateManyUserInputEnvelopeSchema } from './CategoryCreateManyUserInputEnvelopeSchema';
import { CategoryWhereUniqueInputSchema } from './CategoryWhereUniqueInputSchema';

export const CategoryCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default CategoryCreateNestedManyWithoutUserInputSchema;
