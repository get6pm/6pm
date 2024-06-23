import { z } from 'zod';

export const BudgetPeriodTypeSchema = z.enum(['MONTHLY','QUARTERLY','YEARLY','CUSTOM']);

export type BudgetPeriodTypeType = `${z.infer<typeof BudgetPeriodTypeSchema>}`

export default BudgetPeriodTypeSchema;
