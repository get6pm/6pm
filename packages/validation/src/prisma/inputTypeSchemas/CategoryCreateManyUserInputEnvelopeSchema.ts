import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateManyUserInputSchema } from './CategoryCreateManyUserInputSchema';

export const CategoryCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CategoryCreateManyUserInputSchema),z.lazy(() => CategoryCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default CategoryCreateManyUserInputEnvelopeSchema;
