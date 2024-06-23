import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { EnumBudgetTypeWithAggregatesFilterSchema } from './EnumBudgetTypeWithAggregatesFilterSchema';
import { BudgetTypeSchema } from './BudgetTypeSchema';

export const BudgetScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetTypeWithAggregatesFilterSchema),z.lazy(() => BudgetTypeSchema) ]).optional(),
}).strict();

export default BudgetScalarWhereWithAggregatesInputSchema;
