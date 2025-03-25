import { SUPPORTED_CURRENCIES } from '@6pm/db/static-data/currency'
import { z } from '@6pm/ui/lib/zod'

const supportedCurrencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code)
const zSupportedCurrencyCodes = z
  .string()
  .refine((code) => supportedCurrencyCodes.includes(code), {
    message: 'Invalid currency code',
  })

export const zCreateSpace = z.object({
  name: z.string().trim().min(3).max(50),
  baseCurrencyCode: zSupportedCurrencyCodes,
})
export type CreateSpaceValues = z.infer<typeof zCreateSpace>

export const zUpdateSpace = z.object({
  name: z.string().trim().min(3).max(50),
  baseCurrencyCode: zSupportedCurrencyCodes,
})
export type UpdateSpaceValues = z.infer<typeof zUpdateSpace>
