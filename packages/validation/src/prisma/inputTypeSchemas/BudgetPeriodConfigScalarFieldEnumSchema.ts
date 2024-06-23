import { z } from 'zod';

export const BudgetPeriodConfigScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','type','amount','startDate','endDate','budgetId']);

export default BudgetPeriodConfigScalarFieldEnumSchema;
