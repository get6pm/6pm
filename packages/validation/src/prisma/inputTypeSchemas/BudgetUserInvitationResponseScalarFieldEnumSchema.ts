import { z } from 'zod';

export const BudgetUserInvitationResponseScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','acceptedAt','declinedAt','invitationId','createdUserId']);

export default BudgetUserInvitationResponseScalarFieldEnumSchema;
