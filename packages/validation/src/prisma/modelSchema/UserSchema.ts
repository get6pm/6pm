import { z } from 'zod';
import type { UserWalletAccountWithRelations } from './UserWalletAccountSchema'
import type { BudgetUserWithRelations } from './BudgetUserSchema'
import type { TransactionWithRelations } from './TransactionSchema'
import type { BudgetUserInvitationWithRelations } from './BudgetUserInvitationSchema'
import type { BudgetUserInvitationResponseWithRelations } from './BudgetUserInvitationResponseSchema'
import type { CategoryWithRelations } from './CategorySchema'
import { UserWalletAccountWithRelationsSchema } from './UserWalletAccountSchema'
import { BudgetUserWithRelationsSchema } from './BudgetUserSchema'
import { TransactionWithRelationsSchema } from './TransactionSchema'
import { BudgetUserInvitationWithRelationsSchema } from './BudgetUserInvitationSchema'
import { BudgetUserInvitationResponseWithRelationsSchema } from './BudgetUserInvitationResponseSchema'
import { CategoryWithRelationsSchema } from './CategorySchema'

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.string(),
  name: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER RELATION SCHEMA
/////////////////////////////////////////

export type UserRelations = {
  walletAccounts: UserWalletAccountWithRelations[];
  budgetUsers: BudgetUserWithRelations[];
  transactions: TransactionWithRelations[];
  createdBudgetUserInvitations: BudgetUserInvitationWithRelations[];
  createdFromInvitation?: BudgetUserInvitationResponseWithRelations | null;
  categories: CategoryWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> = UserSchema.merge(z.object({
  walletAccounts: z.lazy(() => UserWalletAccountWithRelationsSchema).array(),
  budgetUsers: z.lazy(() => BudgetUserWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationWithRelationsSchema).array(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseWithRelationsSchema).nullable(),
  categories: z.lazy(() => CategoryWithRelationsSchema).array(),
}))

export default UserSchema;
