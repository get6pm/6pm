import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const CategoryCountOutputTypeSelectSchema: z.ZodType<Prisma.CategoryCountOutputTypeSelect> = z.object({
  children: z.boolean().optional(),
  transactions: z.boolean().optional(),
}).strict();

export default CategoryCountOutputTypeSelectSchema;
