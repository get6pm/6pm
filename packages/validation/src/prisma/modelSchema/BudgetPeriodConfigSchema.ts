import { z } from 'zod';
import { Prisma } from '@prisma/client'
import { BudgetPeriodTypeSchema } from '../inputTypeSchemas/BudgetPeriodTypeSchema'
import type { BudgetWithRelations } from './BudgetSchema'
import { BudgetWithRelationsSchema } from './BudgetSchema'

/////////////////////////////////////////
// BUDGET PERIOD CONFIG SCHEMA
/////////////////////////////////////////

export const BudgetPeriodConfigSchema = z.object({
  type: BudgetPeriodTypeSchema,
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'BudgetPeriodConfig']"}),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  budgetId: z.string(),
})

export type BudgetPeriodConfig = z.infer<typeof BudgetPeriodConfigSchema>

/////////////////////////////////////////
// BUDGET PERIOD CONFIG RELATION SCHEMA
/////////////////////////////////////////

export type BudgetPeriodConfigRelations = {
  budget: BudgetWithRelations;
};

export type BudgetPeriodConfigWithRelations = z.infer<typeof BudgetPeriodConfigSchema> & BudgetPeriodConfigRelations

export const BudgetPeriodConfigWithRelationsSchema: z.ZodType<BudgetPeriodConfigWithRelations> = BudgetPeriodConfigSchema.merge(z.object({
  budget: z.lazy(() => BudgetWithRelationsSchema),
}))

export default BudgetPeriodConfigSchema;
