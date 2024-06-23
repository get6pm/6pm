import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryWhereInputSchema } from '../inputTypeSchemas/CategoryWhereInputSchema'

export const CategoryDeleteManyArgsSchema: z.ZodType<Prisma.CategoryDeleteManyArgs> = z.object({
  where: CategoryWhereInputSchema.optional(),
}).strict() ;

export default CategoryDeleteManyArgsSchema;
