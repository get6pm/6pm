import { z } from 'zod';
import type { BudgetUserInvitationWithRelations } from './BudgetUserInvitationSchema'
import type { UserWithRelations } from './UserSchema'
import { BudgetUserInvitationWithRelationsSchema } from './BudgetUserInvitationSchema'
import { UserWithRelationsSchema } from './UserSchema'

/////////////////////////////////////////
// BUDGET USER INVITATION RESPONSE SCHEMA
/////////////////////////////////////////

export const BudgetUserInvitationResponseSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  declinedAt: z.coerce.date().nullable(),
  invitationId: z.string(),
  createdUserId: z.string().nullable(),
})

export type BudgetUserInvitationResponse = z.infer<typeof BudgetUserInvitationResponseSchema>

/////////////////////////////////////////
// BUDGET USER INVITATION RESPONSE RELATION SCHEMA
/////////////////////////////////////////

export type BudgetUserInvitationResponseRelations = {
  invitation: BudgetUserInvitationWithRelations;
  createdUser?: UserWithRelations | null;
};

export type BudgetUserInvitationResponseWithRelations = z.infer<typeof BudgetUserInvitationResponseSchema> & BudgetUserInvitationResponseRelations

export const BudgetUserInvitationResponseWithRelationsSchema: z.ZodType<BudgetUserInvitationResponseWithRelations> = BudgetUserInvitationResponseSchema.merge(z.object({
  invitation: z.lazy(() => BudgetUserInvitationWithRelationsSchema),
  createdUser: z.lazy(() => UserWithRelationsSchema).nullable(),
}))

export default BudgetUserInvitationResponseSchema;
