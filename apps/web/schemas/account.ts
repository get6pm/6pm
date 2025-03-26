import { z } from '@6pm/ui/lib/zod'

export type AccountType = 'DEBIT_MANUAL' | 'CREDIT_MANUAL' | 'CASH_MANUAL'

export const zAccount = z.object({
  type: z
    .literal('DEBIT_MANUAL')
    .or(z.literal('CREDIT_MANUAL'))
    .or(z.literal('CASH_MANUAL')),
  name: z.string().trim().max(50).nonempty(),
  institution: z.string().trim().max(50).optional(),
  lastDigits: z.string().trim().optional(),
  color: z.string().trim().optional(),
  balance: z
    .literal('')
    .transform(() => undefined)
    .or(z.coerce.number().min(0))
    .optional(),
  creditLimit: z
    .literal('')
    .transform(() => undefined)
    .or(z.coerce.number().min(0))
    .optional(),
})
export type AccountValues = z.infer<typeof zAccount>
