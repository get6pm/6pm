import { z } from 'zod';

export const BudgetUserInvitationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','email','token','expiresAt','permission','createdByUserId','budgetId']);

export default BudgetUserInvitationScalarFieldEnumSchema;
