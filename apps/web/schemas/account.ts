import { z } from '@6pm/ui/lib/zod'

export type AccountType = 'debit_manual' | 'credit_manual' | 'cash_manual'

export const zAccount = z.object({
  accountType: z
    .literal('debit_manual')
    .or(z.literal('credit_manual'))
    .or(z.literal('cash_manual')),
  name: z.string().trim().max(50).nonempty(),
  institutionName: z.string().trim().max(50).optional(),
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
