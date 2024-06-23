import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryCreateManyInputSchema } from '../inputTypeSchemas/CategoryCreateManyInputSchema'

export const CategoryCreateManyArgsSchema: z.ZodType<Prisma.CategoryCreateManyArgs> = z.object({
  data: z.union([ CategoryCreateManyInputSchema,CategoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default CategoryCreateManyArgsSchema;
