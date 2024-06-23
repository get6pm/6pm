import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryCountOutputTypeSelectSchema } from './CategoryCountOutputTypeSelectSchema';

export const CategoryCountOutputTypeArgsSchema: z.ZodType<Prisma.CategoryCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CategoryCountOutputTypeSelectSchema).nullish(),
}).strict();

export default CategoryCountOutputTypeSelectSchema;
