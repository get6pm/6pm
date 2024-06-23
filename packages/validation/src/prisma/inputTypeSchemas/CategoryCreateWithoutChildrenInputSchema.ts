import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutCategoriesInputSchema } from './UserCreateNestedOneWithoutCategoriesInputSchema';
import { CategoryCreateNestedOneWithoutChildrenInputSchema } from './CategoryCreateNestedOneWithoutChildrenInputSchema';
import { TransactionCreateNestedManyWithoutCategoryInputSchema } from './TransactionCreateNestedManyWithoutCategoryInputSchema';

export const CategoryCreateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateWithoutChildrenInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export default CategoryCreateWithoutChildrenInputSchema;
