import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CategoryWhereInputSchema } from '../inputTypeSchemas/CategoryWhereInputSchema'
import { CategoryOrderByWithAggregationInputSchema } from '../inputTypeSchemas/CategoryOrderByWithAggregationInputSchema'
import { CategoryScalarFieldEnumSchema } from '../inputTypeSchemas/CategoryScalarFieldEnumSchema'
import { CategoryScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/CategoryScalarWhereWithAggregatesInputSchema'

export const CategoryGroupByArgsSchema: z.ZodType<Prisma.CategoryGroupByArgs> = z.object({
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithAggregationInputSchema.array(),CategoryOrderByWithAggregationInputSchema ]).optional(),
  by: CategoryScalarFieldEnumSchema.array(),
  having: CategoryScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default CategoryGroupByArgsSchema;
