import { z } from 'zod'
import { UserWalletAccountSchema } from './prisma'

export const zCreateWallet = z.object({
  name: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  lastDigits: z.string().optional(),
  preferredCurrency: z.string(),
})
export type CreateWallet = z.infer<typeof zCreateWallet>

export const zUpdateWallet = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  lastDigits: z.string().optional(),
  preferredCurrency: z.string().optional(),
})
export type UpdateWallet = z.infer<typeof zUpdateWallet>

export const zWalletFormValues = zCreateWallet.extend({
  balance: z.number({ coerce: true }).optional(),
})
export type WalletFormValues = z.infer<typeof zWalletFormValues>

export const WalletAccountWithBalanceSchema = UserWalletAccountSchema.extend({
  balance: z.number({ coerce: true }).optional(),
})

export type WalletAccountWithBalance = z.infer<
  typeof WalletAccountWithBalanceSchema
>
