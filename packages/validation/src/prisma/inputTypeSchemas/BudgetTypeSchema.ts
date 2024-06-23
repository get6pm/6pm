import { z } from 'zod';

export const BudgetTypeSchema = z.enum(['SPENDING','SAVING','INVESTING','DEBT']);

export type BudgetTypeType = `${z.infer<typeof BudgetTypeSchema>}`

export default BudgetTypeSchema;
