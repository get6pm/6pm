import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema } from './TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema';

export const CategoryUncheckedCreateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutChildrenInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  parentId: z.string().optional().nullable(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export default CategoryUncheckedCreateWithoutChildrenInputSchema;
