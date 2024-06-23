import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CategoryArgsSchema } from "../outputTypeSchemas/CategoryArgsSchema"
import { CategoryFindManyArgsSchema } from "../outputTypeSchemas/CategoryFindManyArgsSchema"
import { TransactionFindManyArgsSchema } from "../outputTypeSchemas/TransactionFindManyArgsSchema"
import { CategoryCountOutputTypeArgsSchema } from "../outputTypeSchemas/CategoryCountOutputTypeArgsSchema"

export const CategoryIncludeSchema: z.ZodType<Prisma.CategoryInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  parent: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  children: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CategoryCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default CategoryIncludeSchema;
