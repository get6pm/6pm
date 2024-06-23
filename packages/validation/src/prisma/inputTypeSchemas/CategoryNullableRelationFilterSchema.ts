import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryWhereInputSchema } from './CategoryWhereInputSchema';

export const CategoryNullableRelationFilterSchema: z.ZodType<Prisma.CategoryNullableRelationFilter> = z.object({
  is: z.lazy(() => CategoryWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => CategoryWhereInputSchema).optional().nullable()
}).strict();

export default CategoryNullableRelationFilterSchema;
