import { z } from '@6pm/ui/lib/zod'

export type AccountType = 'DEBIT_MANUAL' | 'CREDIT_MANUAL' | 'CASH_MANUAL'
export const AccountType = {
  DEBIT_MANUAL: 'DEBIT_MANUAL',
  CREDIT_MANUAL: 'CREDIT_MANUAL',
  CASH_MANUAL: 'CASH_MANUAL',
} as const

export const zAccount = z.object({
  id: z.string().cuid2().optional(),
  type: z.nativeEnum(AccountType),
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
