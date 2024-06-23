import { z } from 'zod';

export const BudgetUserScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','permission','userId','budgetId']);

export default BudgetUserScalarFieldEnumSchema;
