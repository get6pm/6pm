import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutCategoriesInputSchema } from './UserCreateNestedOneWithoutCategoriesInputSchema';
import { CategoryCreateNestedOneWithoutChildrenInputSchema } from './CategoryCreateNestedOneWithoutChildrenInputSchema';
import { CategoryCreateNestedManyWithoutParentInputSchema } from './CategoryCreateNestedManyWithoutParentInputSchema';

export const CategoryCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateWithoutTransactionsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  children: z.lazy(() => CategoryCreateNestedManyWithoutParentInputSchema).optional()
}).strict();

export default CategoryCreateWithoutTransactionsInputSchema;
