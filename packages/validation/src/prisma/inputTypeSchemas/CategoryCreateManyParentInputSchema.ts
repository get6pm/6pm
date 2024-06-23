import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const CategoryCreateManyParentInputSchema: z.ZodType<Prisma.CategoryCreateManyParentInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string()
}).strict();

export default CategoryCreateManyParentInputSchema;
