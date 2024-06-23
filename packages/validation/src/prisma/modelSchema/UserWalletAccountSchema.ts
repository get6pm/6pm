import { z } from 'zod';
import type { UserWithRelations } from './UserSchema'
import type { TransactionWithRelations } from './TransactionSchema'
import { UserWithRelationsSchema } from './UserSchema'
import { TransactionWithRelationsSchema } from './TransactionSchema'

/////////////////////////////////////////
// USER WALLET ACCOUNT SCHEMA
/////////////////////////////////////////

export const UserWalletAccountSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  lastDigits: z.string().nullable(),
  preferredCurrency: z.string(),
  userId: z.string(),
})

export type UserWalletAccount = z.infer<typeof UserWalletAccountSchema>

/////////////////////////////////////////
// USER WALLET ACCOUNT RELATION SCHEMA
/////////////////////////////////////////

export type UserWalletAccountRelations = {
  user: UserWithRelations;
  transactions: TransactionWithRelations[];
};

export type UserWalletAccountWithRelations = z.infer<typeof UserWalletAccountSchema> & UserWalletAccountRelations

export const UserWalletAccountWithRelationsSchema: z.ZodType<UserWalletAccountWithRelations> = UserWalletAccountSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
}))

export default UserWalletAccountSchema;
