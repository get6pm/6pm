import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryCreateManyParentInputSchema } from './CategoryCreateManyParentInputSchema';

export const CategoryCreateManyParentInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyParentInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CategoryCreateManyParentInputSchema),z.lazy(() => CategoryCreateManyParentInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default CategoryCreateManyParentInputEnvelopeSchema;
