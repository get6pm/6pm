import { z } from 'zod'
import { CategorySchema, TransactionSchema } from './prisma'

export const zCreateTransaction = z.object({
  date: z.date({ coerce: true }),
  amount: z.number(),
  currency: z.string(),
  note: z.string().optional(),
  budgetId: z.string().optional(),
  walletAccountId: z.string(),
  categoryId: z.string().optional(),
})
export type CreateTransaction = z.infer<typeof zCreateTransaction>

export const zUpdateTransaction = z.object({
  date: z.date({ coerce: true }).optional(),
  amount: z.number({ coerce: true }).optional(),
  currency: z.string().optional(),
  note: z.string().optional(),
  budgetId: z.string().optional(),
  walletAccountId: z.string().optional(),
  categoryId: z.string().optional(),
})
export type UpdateTransaction = z.infer<typeof zUpdateTransaction>

export const zTransactionFormValues = zCreateTransaction
export type TransactionFormValues = z.infer<typeof zTransactionFormValues>

export const TransactionPopulatedSchema = TransactionSchema.extend({
  category: CategorySchema.nullable().optional(),
  amount: z.number({ coerce: true }),
  amountInVnd: z.number({ coerce: true }),
})

export type TransactionPopulated = z.infer<typeof TransactionPopulatedSchema>
