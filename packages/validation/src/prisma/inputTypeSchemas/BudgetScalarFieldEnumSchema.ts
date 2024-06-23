import { z } from 'zod';

export const BudgetScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','description','preferredCurrency','type']);

export default BudgetScalarFieldEnumSchema;
