import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { EnumBudgetPeriodTypeFilterSchema } from './EnumBudgetPeriodTypeFilterSchema';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';
import { DecimalFilterSchema } from './DecimalFilterSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { BudgetRelationFilterSchema } from './BudgetRelationFilterSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetPeriodConfigWhereInputSchema: z.ZodType<Prisma.BudgetPeriodConfigWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict();

export default BudgetPeriodConfigWhereInputSchema;
