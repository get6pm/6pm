import { z } from '@6pm/ui/lib/zod'

export const zDebitAccount = z.object({
  name: z.string().trim().max(50).nonempty(),
  institutionName: z.string().trim().max(50).optional(),
  lastDigits: z.string().trim().optional(),
  balance: z.coerce.number().min(0).default(0).optional(),
  color: z.string().trim().optional(),
})
export type DebitAccountValues = z.infer<typeof zDebitAccount>
