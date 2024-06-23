import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { BudgetPeriodTypeSchema } from './BudgetPeriodTypeSchema';
import { isValidDecimalInput } from './isValidDecimalInput';
import { DecimalJsLikeSchema } from './DecimalJsLikeSchema';
import { BudgetCreateNestedOneWithoutPeriodConfigInputSchema } from './BudgetCreateNestedOneWithoutPeriodConfigInputSchema';

export const BudgetPeriodConfigCreateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutPeriodConfigInputSchema)
}).strict();

export default BudgetPeriodConfigCreateInputSchema;
