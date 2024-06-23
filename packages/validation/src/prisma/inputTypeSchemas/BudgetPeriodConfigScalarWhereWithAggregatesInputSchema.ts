import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';
import { EnumBudgetPeriodTypeWithAggregatesFilterSchema } from './EnumBudgetPeriodTypeWithAggregatesFilterSchema';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';
import { DecimalWithAggregatesFilterSchema } from './DecimalWithAggregatesFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DateTimeNullableWithAggregatesFilterSchema } from './DateTimeNullableWithAggregatesFilterSchema';

export const BudgetPeriodConfigScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetPeriodConfigScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeWithAggregatesFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export default BudgetPeriodConfigScalarWhereWithAggregatesInputSchema;
