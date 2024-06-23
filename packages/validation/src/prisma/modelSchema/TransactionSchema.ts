import { z } from 'zod';
import { Prisma } from '@prisma/client'
import type { CategoryWithRelations } from './CategorySchema'
import type { BudgetWithRelations } from './BudgetSchema'
import type { UserWalletAccountWithRelations } from './UserWalletAccountSchema'
import type { UserWithRelations } from './UserSchema'
import { CategoryWithRelationsSchema } from './CategorySchema'
import { BudgetWithRelationsSchema } from './BudgetSchema'
import { UserWalletAccountWithRelationsSchema } from './UserWalletAccountSchema'
import { UserWithRelationsSchema } from './UserSchema'

/////////////////////////////////////////
// TRANSACTION SCHEMA
/////////////////////////////////////////

export const TransactionSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'Transaction']"}),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().nullable(),
  categoryId: z.string().nullable(),
  budgetId: z.string().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string(),
})

export type Transaction = z.infer<typeof TransactionSchema>

/////////////////////////////////////////
// TRANSACTION RELATION SCHEMA
/////////////////////////////////////////

export type TransactionRelations = {
  category?: CategoryWithRelations | null;
  budget?: BudgetWithRelations | null;
  walletAccount: UserWalletAccountWithRelations;
  createdByUser: UserWithRelations;
};

export type TransactionWithRelations = z.infer<typeof TransactionSchema> & TransactionRelations

export const TransactionWithRelationsSchema: z.ZodType<TransactionWithRelations> = TransactionSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  budget: z.lazy(() => BudgetWithRelationsSchema).nullable(),
  walletAccount: z.lazy(() => UserWalletAccountWithRelationsSchema),
  createdByUser: z.lazy(() => UserWithRelationsSchema),
}))

export default TransactionSchema;
