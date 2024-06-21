import { z } from 'zod'

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

export const zAccountFormValues = zCreateWallet.extend({
  balance: z.number({ coerce: true }).positive().optional(),
})
export type AccountFormValues = z.infer<typeof zAccountFormValues>
