import { z } from 'zod'

export const zCreateTransaction = z.object({
  date: z.date(),
  amount: z.number(),
  currency: z.string(),
  note: z.string().optional(),
  budgetId: z.string().optional(),
  walletAccountId: z.string(),
})
export type CreateTransaction = z.infer<typeof zCreateTransaction>

export const zUpdateTransaction = z.object({
  date: z.date().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  note: z.string().optional(),
  budgetId: z.string().optional(),
  walletId: z.string().optional(),
})
export type UpdateTransaction = z.infer<typeof zUpdateTransaction>
