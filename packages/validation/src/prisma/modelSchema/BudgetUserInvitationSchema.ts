import { z } from 'zod';
import { BudgetUserPermissionSchema } from '../inputTypeSchemas/BudgetUserPermissionSchema'
import type { UserWithRelations } from './UserSchema'
import type { BudgetWithRelations } from './BudgetSchema'
import type { BudgetUserInvitationResponseWithRelations } from './BudgetUserInvitationResponseSchema'
import { UserWithRelationsSchema } from './UserSchema'
import { BudgetWithRelationsSchema } from './BudgetSchema'
import { BudgetUserInvitationResponseWithRelationsSchema } from './BudgetUserInvitationResponseSchema'

/////////////////////////////////////////
// BUDGET USER INVITATION SCHEMA
/////////////////////////////////////////

export const BudgetUserInvitationSchema = z.object({
  permission: BudgetUserPermissionSchema.nullable(),
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.string().nullable(),
  token: z.string().uuid(),
  expiresAt: z.coerce.date(),
  createdByUserId: z.string(),
  budgetId: z.string(),
})

export type BudgetUserInvitation = z.infer<typeof BudgetUserInvitationSchema>

/////////////////////////////////////////
// BUDGET USER INVITATION RELATION SCHEMA
/////////////////////////////////////////

export type BudgetUserInvitationRelations = {
  createdByUser: UserWithRelations;
  budget: BudgetWithRelations;
  responses: BudgetUserInvitationResponseWithRelations[];
};

export type BudgetUserInvitationWithRelations = z.infer<typeof BudgetUserInvitationSchema> & BudgetUserInvitationRelations

export const BudgetUserInvitationWithRelationsSchema: z.ZodType<BudgetUserInvitationWithRelations> = BudgetUserInvitationSchema.merge(z.object({
  createdByUser: z.lazy(() => UserWithRelationsSchema),
  budget: z.lazy(() => BudgetWithRelationsSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseWithRelationsSchema).array(),
}))

export default BudgetUserInvitationSchema;
